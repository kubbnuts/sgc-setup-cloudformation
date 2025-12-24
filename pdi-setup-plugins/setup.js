/**
* Installs a list of plugins and applications.
*
* V1
* Maik Skoddow - ref https://www.linkedin.com/posts/maik-skoddow_servicenow-activity-7160527557782630400-vP99?utm_source=share&utm_medium=member_desktop&rcm=ACoAAACoorEBNNilWj5jyyWNAyIPtQx_feK7JU0
* V2
* Sophie Kubitz - ref https://kubbs.substack.com/p/programmatic-pdi-setup for usage

* @param {Array} arrToBeInstalled
*    List of plugin IDs or application scope to be installed
* @param {Boolean} dryRun
*    If `true` only output is given but no installations are performed
* @param {Boolean} loadDemoData
*    If `false` demo data is not installed
*/
function installPluginsAndApplications(arrToBeInstalled, dryRun, loadDemoData) {

    if (!Array.isArray(arrToBeInstalled) || arrToBeInstalled.length === 0) {
        gs.error('Parameter "arrToBeInstalled" does not represent a valid array!');
    }

    var _dryRun           = typeof dryRun === 'boolean' ? dryRun : false;
    var _loadDemoData     = typeof loadDemoData === 'boolean' ? loadDemoData : false;
    var _objToBeInstalled = {};
    var _grPlugins        = new GlideRecord('v_plugin');
    var _grRemoteApps     = new GlideRecord('sys_remote_app');
    var _grInstalledApps  = new GlideRecord('sys_store_app');

    Array.forEach(arrToBeInstalled, function(strID) {
        if (_grPlugins.get('id', strID)) {
            if (_grPlugins.getValue('active') == 'active') {
                gs.warn(
                    'Plugin "{0}" (ID: {1}) is already installed!', 
                    _grPlugins.name, strID
                );
            }
            else {
                _objToBeInstalled[strID] = {
                    "plugin_id" : strID,
                    "scope"     : _grPlugins.getValue('scope'),
                    "app_name"  : _grPlugins.getValue('name'),
                    "loadDemoData" : _loadDemoData,
                    "isPlugin"  : true
                }

                gs.info(
                    'Queue Plugin "{0}" (ID: {1}) for installation', 
                    _grPlugins.getValue('name'), strID
                );
            }
        }
        else if (_grInstalledApps.get('scope', strID)) {
            gs.warn(
                'Application "{0}" (ID: {1}) is already installed!', 
                _grInstalledApps.name, strID
            );
        }
        else if (_grRemoteApps.get('scope', strID)) {
            _objToBeInstalled[_grRemoteApps.getUniqueValue()] = {
                "sys_id"    : _grRemoteApps.getUniqueValue(),
                "app_name"  : _grRemoteApps.getValue('name'),
                "loadDemoData": _loadDemoData,
                "isStoreApp": true,
                "appScope"  : strID,
                "versionObj": {
                    "version": _grRemoteApps.getValue('latest_version')
                }
            }                

            gs.info(
                'Queue Application "{0}" (ID: {1}) for installation', 
                _grRemoteApps.getValue('name'), strID
            );
        }
        else {
            gs.error('"{0}" is not a valid plugin or application ID!', strID)
        }
    });
        
    if( Object.keys(_objToBeInstalled).length > 0 ) {
        gs.info(
            'Start installation of {0} plugins and applications... ',
            Object.keys(_objToBeInstalled).length
        );
        if (!_dryRun) {
            gs.info(
                JSON.stringify(
                    new sn_appclient.AppPluginInstallation().validateAndBatchInstall(
                        'PDI Installation',
                        _objToBeInstalled
                    )
                )
            );
            gs.info(
                'To follow the installation progress, go to sys_batch_install_plan: https://{0}.service-now.com/now/nav/ui/classic/params/target/sys_batch_install_plan_list.do', gs.getProperty('instance_name')
            );
        }
    } else {
        gs.info(
            'No plugins or applications will be installed...'
        );
    }
}

installPluginsAndApplications([
    'com.snc.itom.discovery.license', //ITOM Discovery License
    'sn_sgc_central',       //	SGC Central	
                            //Service Graph Connector Central (SGC Central) provides a modern, unified console for managing Service Graph Connectors.
    'sn_int_studio',        //	IntegrationHub ETL
                            //Easy to use extract, transform, load tool for data ingestion through IRE
    'sn_aws_integ',         //	Service Graph Connector for AWS
                            //The Service Graph Connector for AWS imports data from AWS to the ServiceNow Configuration Management Database (CMDB).
    'sn_itom_pattern',      //	Discovery and Service Mapping Patterns
    'sn_cmdb_ci_class',     //	CMDB CI Class Models
                            //A single source for all new base-system CMDB CI class models from ServiceNow
    'sn_ent',               //	Expanded Model and Asset Classes
    'sn_cmdb_foundation',   //	Data Foundation Model
                            //Support foundational product engineering data model constructs that need to be installed on customer instances.
    'sn_cmdb_int_util',     //	Integration Commons for CMDB
    'sn_getwell', //CMDB and CSDM Data Foundations Dashboards

]);
