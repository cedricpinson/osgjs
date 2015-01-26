import subprocess
import sys
import os
import time
import math
import json

DEBUG=False

envIrradiance_cmd="~/dev/envtools/release/envIrradiance"
envPrefilter_cmd="~/dev/envtools/release/envPrefilter"
envIntegrateBRDF_cmd="~/dev/envtools/release/envBRDF"
cubemap_packer_cmd="~/dev/envtools/release/cubemapPacker"
panorama_packer_cmd="~/dev/envtools/release/panoramaPacker"
envremap_cmd="~/dev/envtools/release/envremap"
seamlessCubemap_cmd="~/dev/envtools/release/seamlessCubemap"
envBackground_cmd="~/dev/envtools/release/envBackground"
gzip_cmd="gzip"
7zip_cmd="7z"

def execute_command(cmd, **kwargs):

    try:
        start = 0
        end = 0
        if kwargs.get("profile", True):
            start = time.time()

        output = subprocess.check_output(cmd, stderr=subprocess.STDOUT, shell=True)

        if kwargs.get("profile", True):
            end = time.time()

        if kwargs.get("verbose", True) or kwargs.get("print_command", False):
            print ("{} - {}".format(end - start, cmd))

        if kwargs.get("verbose", True) and output:
            print (output)

        return output

    except subprocess.CalledProcessError as error:
        print("error {} executing {}".format(error.returncode, cmd))
        print(error.output)
        sys.exit(1)
        return None


class ProcessEnvironment(object):

    def __init__(self, input_file, output_directory, **kwargs):
        self.input_file = os.path.abspath(input_file)
        self.output_directory = output_directory
        self.specular_size = kwargs.get("specular_size", 512 )
        self.integrate_BRDF_size = kwargs.get("brdf_texture_size", 128 )
        self.irradiance_size = kwargs.get("irradiance_size", 32 )
        self.pattern_filter = kwargs.get("pattern_filter", "rgss" )
        self.nb_samples = kwargs.get("nb_samples", "1024" )
        self.prefilter_stop_size = kwargs.get("prefilter_stop_size", 8 )

        self.background_size = kwargs.get("background_size", 256 )
        self.background_blur = kwargs.get("background_blur", 1.5 )



    def writeConfig(self, filename):
        output = open( filename, "w" )
        config = {
            "specularCubemapSize": self.specular_size,
            "specularPanoramaSize": self.specular_size * 4,
            "specularLimitSize": self.prefilter_stop_size,

            "shCoefs": json.loads(self.sh_coef)
        }
        json.dump(config, output)


    def encode_texture(self, input_file, output_directory=None):

        if not output_directory:
            output_directory = os.path.dirname(input_file)

        filename = os.path.basename(input_file)
        filename_without_extension = os.path.splitext(filename)[0]

        output = os.path.join(output_directory, filename_without_extension) + ".png"

        cmd = "~/dev/rgbx/build/rgbx -m rgbe {} {}".format(input_file, output)
        output = execute_command(cmd, verbose=False)

    def extract_cubemap_face_and_encode(self, input, output, index):

        output_file = "{}_{}.tif".format(output, index)
        cmd = "oiiotool {} -subimage {} -o {}".format(input, index, output_file)
        execute_command(cmd)
        self.encode_texture(output_file)

    def create_cubemap(self, input_cubemap, output_directory):

        for cubemap_face in range(0, 6):
            self.extract_cubemap_face_and_encode(input_cubemap, output_directory, cubemap_face)

    def compute_irradiance(self, input):

        tmp = "/tmp/irr.tif"

        cmd = "{} -n {} {} {}".format( envIrradiance_cmd, self.irradiance_size, input, tmp)
        output_log = execute_command(cmd, verbose=False, print_command=True)

        lines_list = output_log.split("\n")
        for line in lines_list:
            index = line.find("shCoef:")
            if index != -1:
                self.sh_coef = line[line.find(":") + 1:]
                # with open( os.path.join(self.output_directory, "spherical"), "w") as f:
                #     f.write(self.sh_coef)
                # break


        # generate texture for irrandiance
        # since we use spherical harmonics we dont need textures anymore except for debugging
        if DEBUG is True:
            self.create_cubemap(tmp, os.path.join(self.output_directory, "cubemap_irradiance"))

            # compute the panorama version of irradiance
            panorama_size = self.irradiance_size * 2
            panorama_irradiance = "/tmp/panorama_irradiance.tif"

            cmd = "{} -n {} -i cube -o rect {} {}".format( envremap_cmd, panorama_size, tmp, panorama_irradiance)
            execute_command(cmd)

            self.encode_texture(panorama_irradiance, self.output_directory)

    def cubemap_fix_border(self, input, output):
        cmd = "{} {} {}".format(seamlessCubemap_cmd, input, output)
        execute_command(cmd)

    def cubemap_packer(self, pattern, max_level, output ):
        cmd = ""
        if max_level > 0:
            cmd = "{} -p -n {} {} {}".format(cubemap_packer_cmd, max_level, pattern, output)
        else:
            cmd = "{} {} {}".format(cubemap_packer_cmd, pattern, output)
        execute_command(cmd)

        cmd = "gzip -f {}".format( output + "*.bin")
        execute_command(cmd)


    def panorama_packer(self, pattern, max_level, output ):
        cmd = "{} {} {} {}".format(panorama_packer_cmd, pattern, max_level, output)
        execute_command(cmd)

        cmd = "gzip -f {}".format( output + "*.bin")
        execute_command(cmd)

    def cubemap_specular_create_mipmap(self, input):

        max_level = int(math.log(self.specular_size) / math.log(2))

        previous_file = self.cubemap_generic
        self.cubemap_fix_border(previous_file, "/tmp/fixup_0.tif")

        for i in range(1, max_level + 1):
            size = int(math.pow(2, max_level - i))
            level = i;
            outout_filename = "/tmp/specular_{}.tif".format(i)
            cmd = "{} -p {} -n {} -i cube -o cube {} {}".format(envremap_cmd, self.pattern_filter, size, previous_file, outout_filename)
            previous_file = outout_filename
            execute_command(cmd)
            self.cubemap_fix_border(outout_filename, "/tmp/fixup_{}.tif".format( i ) )

        self.cubemap_packer("/tmp/fixup_%d.tif", max_level, os.path.join(self.output_directory, "cubemap_mipmap") )



    def cubemap_specular_create_prefilter(self, input ):
        import shutil

        max_level = int(math.log(self.specular_size) / math.log(2))

        # compute it one time for panorama
        outout_filename = "/tmp/prefilter_specular"
        cmd = "{} -s {} -e {} -n {} {} {}".format(envPrefilter_cmd, self.specular_size, self.prefilter_stop_size, self.nb_samples, self.cubemap_generic , outout_filename)
        execute_command(cmd)

        # compute it seamless for cubemap
        outout_filename = "/tmp/prefilter_fixup"
        cmd = "{} -s {} -e {} -n {} -f {} {}".format(envPrefilter_cmd, self.specular_size, self.prefilter_stop_size, self.nb_samples, self.cubemap_generic , outout_filename)
        execute_command(cmd)

        self.cubemap_packer("/tmp/prefilter_fixup_%d.tif", max_level, os.path.join(self.output_directory, "cubemap_prefilter"))

        # create the integrateBRDF texture
        # we dont need to recreate it each time
        outout_filename = os.path.join(self.output_directory, "brdf.bin" )
        cmd = "{} -s {} -n {} {}".format(envIntegrateBRDF_cmd, self.integrate_BRDF_size, self.nb_samples, outout_filename)
        execute_command(cmd)

        cmd = "gzip -f {}".format( outout_filename )
        execute_command(cmd)


    def background_create( self ):

        # compute it one time for panorama
        outout_filename = "/tmp/background.tiff"
        cmd = "{} -s {} -n {} -r {} -f {}".format(envBackground_cmd, self.background_size, self.nb_samples, self.background_blur , outout_filename)
        execute_command(cmd)

        # packer use a pattern, fix cubemap packer ?
        input_filename = outout_filename
        output = os.path.join(self.output_directory, "cubemap_background" )
        self.cubemap_packer( input_filename, 0, output )

        cmd = "gzip -f {}".format( output + "*.bin")
        execute_command(cmd)


    # use the step from cubemap prefilter
    def panorama_specular_create_prefilter(self):

        # panorama is 4 * cubemap face
        # cubemap of 512 -> panorama 2048

        # but we dont change the generation of lod, we will not use
        # end of mipmap level
        max_cubemap_level = int(math.log(self.specular_size) / math.log(2)) + 1
        max_level = int(math.log(self.specular_size*4) / math.log(2)) + 1

        for i in range(1, max_cubemap_level):
            level = i - 1
            size = pow(2, max_level - i )
            input_filename = "/tmp/prefilter_specular_{}.tif".format(level)
            output_filename = "/tmp/panorama_prefilter_specular_{}.tif".format(level)
            cmd = "{} -p {} -n {} -i cube -o rect {} {}".format(envremap_cmd, self.pattern_filter, size/2, input_filename, output_filename)
            execute_command(cmd)

        self.panorama_packer("/tmp/panorama_prefilter_specular_%d.tif", max_level - 1, os.path.join(self.output_directory, "panorama_prefilter"))

    def panorama_specular(self, input):

        # compute the panorama from cubemap specular
        panorama_size = self.specular_size * 2
        panorama_specular = "/tmp/panorama.tif"
        cmd = "{} -p {} -n {} -i rect -o rect {} {}".format( envremap_cmd, self.pattern_filter, panorama_size, input, panorama_specular)
        execute_command(cmd)

        self.encode_texture(panorama_specular, self.output_directory)

    def run(self):

        start = time.time()

        if not os.path.exists(self.output_directory):
            os.makedirs(self.output_directory)

        cubemap_generic = "/tmp/input_cubemap.tif"

        original_file = "/tmp/original_panorama.tif"
        cmd = "iconvert {} {}".format(self.input_file, original_file )
        execute_command(cmd)

        cmd = "{} -p {} -o cube -n {} {} {}".format(envremap_cmd, self.pattern_filter, self.specular_size, original_file, cubemap_generic)
        self.cubemap_generic = cubemap_generic
        execute_command(cmd)

        # create cubemap original for debug
        if DEBUG is True:
            self.create_cubemap(cubemap_generic, os.path.join(self.output_directory, 'cubemap'))

        # generate irradiance*PI panorama/cubemap/sph
        self.compute_irradiance(cubemap_generic)

        # generate specular
        self.cubemap_specular_create_mipmap(cubemap_generic)

        # generate panorama specular
        self.panorama_specular(original_file)


        # generate prefilter ue4 specular
        self.cubemap_specular_create_prefilter(cubemap_generic)

        # generate prefilter ue4 specular panorama
        self.panorama_specular_create_prefilter()


        # generate background
        self.background_create()


        # write config for this environment
        self.writeConfig( os.path.join(self.output_directory, "config.json" ) )


        print ("processed in {} seconds".format(time.time() - start))


argv = sys.argv
input_file = argv[1]
output_directory = argv[2]
#pattern_filter = argv[3]

#process = ProcessEnvironment(input_file, output_directory, specular_size = 256, nb_samples = 65536)
#process = ProcessEnvironment(input_file, output_directory, specular_size = 256, nb_samples = 1024)
#process = ProcessEnvironment( input_file, output_directory, specular_size = 512, nb_samples = 65536, prefilter_stop_size = 8 )
process = ProcessEnvironment( input_file, output_directory, specular_size = 256, nb_samples = 32, prefilter_stop_size = 65536 )
#process = ProcessEnvironment(input_file, output_directory, nb_samples = 1024)
process.run()


# create a cubemap for original to max size we will use


# compute irradiance
# compute irrandiance from cubemap
# extract spherical harmonics

# convert cubemap irradiance to panorama

# encode panorama irradiance to png rgbe
# encode cubemap irradiance to png rgbe


# specular
# for all mipmap level
# resize and fixEdge
# pack and encode
