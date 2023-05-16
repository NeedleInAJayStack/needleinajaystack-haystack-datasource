#! /bin/bash

# This creates a deploy-able plugin zip file in the release directory.
# 
# Installation instructions:
# 1. Determine the Grafana server URL. This may not be the public URL, and are defined in the `server` section
#    of the Settings page or grafana.ini file. For example, the server URL may be http://localhost:3000.
# 2. Run this script with the server URL.
# 3. Copy the zip file to the machine hosting grafana and unzip into the grafana plugins directory 
#    (/var/lib/grafana/plugins on linux).
# 4. Restart grafana.

set -eo pipefail

usage() {
cat << EOF
Usage: $0 -u [root_urls] -k [api_key]

Packages the project as a "private" plugin so it may be used on a grafana server.
The end result is a zip file in the 'release' directory containing the plugin.

Unfortunately, only NeedleInAJayStack can run this since the API key cloud account must match the datasource name.
This is a workaround until the package is approved as a "public" plugin by Grafana.

-u  root_urls:   Comma separated list of root urls for the grafana server.
-k  api_key:     API key for the grafana server.
EOF
exit 1
}

# This follows the gitlab release.yml file.
main() {
  export GRAFANA_API_KEY=${api_key}

  # Install dependencies
  yarn install --immutable --prefer-offline

  # Build and test frontend
  yarn build

  # Test backend
  mage coverage

  # Build backend
  mage buildAll

  # Sign plugin
  npx @grafana/sign-plugin

  # Get plugin metadata
  plugin_id=$(cat dist/plugin.json | jq -r .id)
  archive=${plugin_id}.zip

  # Package plugin
  mv -f dist ${plugin_id}

  if [ ! -d "release" ]; then
    mkdir release
  fi
  zip release/${archive} ${plugin_id} -r

  # Cleanup
  rm -r ${plugin_id}
}

while getopts ":k:u:" option; do
  case "$option" in
    k) 
      readonly api_key=${OPTARG}
      ;;
    u)
      readonly rootUrls=${OPTARG}
      ;;
    *) 
      usage
      ;;
  esac
done

if [ -z "${rootUrls}" ] || [ -z "${api_key}" ]; then
    usage
fi

main
