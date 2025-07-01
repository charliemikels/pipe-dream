pkgdatadir = get_option('datadir') / meson.project_name()
gnome = import('gnome')

src_res = gnome.compile_resources('place.pumpkin.pipedream.src',
  'place.pumpkin.pipedream.src.gresource.xml',
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
)

data_res = gnome.compile_resources('place.pumpkin.pipedream.data',
  'place.pumpkin.pipedream.data.gresource.xml',
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
)

bin_conf = configuration_data()
bin_conf.set('GJS', find_program('gjs').full_path())
bin_conf.set('PACKAGE_VERSION', meson.project_version())
bin_conf.set('PACKAGE_NAME', meson.project_name())
bin_conf.set('prefix', get_option('prefix'))
bin_conf.set('libdir', get_option('prefix') / get_option('libdir'))
bin_conf.set('datadir', get_option('prefix') / get_option('datadir'))
bin_conf.set('resource_path', '/place/pumpkin/pipedream')

configure_file(
  input: 'place.pumpkin.pipedream.in',
  output: 'place.pumpkin.pipedream',
  configuration: bin_conf,
  install: true,
  install_dir: get_option('bindir')
)
