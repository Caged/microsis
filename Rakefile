require 'rake'
require 'rake/packagetask'
require 'fileutils'
require 'pathname'

include FileUtils

$:.unshift(File.expand_path(File.dirname(__FILE__)))
%w(lib vendor).each do |d|
  $:.unshift(File.join(File.dirname(__FILE__)), d)
end

YUI_COMPRESSOR_BIN = "java -jar vendor/yuicompressor/build/yuicompressor-2.2.4.jar --warn"
JAVASCRIPT_SOURCE_FILES = Dir["src/**/*.js"]

desc "Build and compress from source"
task :build do
  JAVASCRIPT_SOURCE_FILES.each do |f|
    path = Pathname.new(f)
    component = path.parent.basename
    mkdir("build/#{component}") unless (File.exists?("build/#{component}"))
    cp "#{path}", "build/#{component}"
  end
end

desc "Compress build files using YUI Compressor"
task :compress => :build do
  Dir["build/**/*[^-min].js"].each do |f|
    path = Pathname.new(f)
    basename = path.basename(f).sub(/\.js$/, '')
    compressed_name = path.parent + "#{basename}-min.js"
    `#{YUI_COMPRESSOR_BIN} -o #{compressed_name} #{path}`
  end
end
    

module MicrosisBuilder
  def compress(file, line_break)
     path = Pathname.new(file)
     puts path
    #`#{YUI_COMPRESSOR_BIN} `
  end
end