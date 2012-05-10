/*
 *      A service-now business rule to test the NolioAPI script include
 */


gs.include('NolioAPI');

var url = "http://184.106.226.87:8080/datamanagement/ws/OpenAPIService";
var user = "superuser";
var pwd = "suser";

var api = new NolioAPI();
api.initialize(url, user, pwd);


var applist = api.getAllApplications();
for (i = 0; i <  applist.getLength(); i++){
	var envlist = api.getEnvironmentsForApplication(applist.item(i).getLastChild().getNodeValue());  
        for(z = 0; z <  envlist.getLength(); z++) {
            api.getAssignedProcessesForEnvironment(applist.item(i).getLastChild().getNodeValue(), envlist.item(z).getLastChild().getNodeValue());
        }
}