public class ApiCallForGraphQL {
    @AuraEnabled(cacheable = false)
    public static String executeGraphQLQuery(String query) {
        System.debug('=== Start of executeGraphQLQuery method ===');

        // Named Credentiall should be configured in Salesforce setup as per previous instructions
        String graphQlEndpoint = 'callout:Salesforce_GraphQL_NamedCredential/services/data/v61.0/graphql';
        
        // Log the query
        System.debug('GraphQL Query: ' + query);
        
        // Create the HTTP request for the GraphQL call
        HttpRequest req = new HttpRequest();
        req.setEndpoint(graphQlEndpoint);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        
        // Form the request body for GraphQL
        String requestBody = JSON.serialize(new Map<String, Object>{
            'query' => query
        });
        
        req.setBody(requestBody);
        
        // Send the HTTP request
        Http http = new Http();
        HttpResponse res;

        try {
            res = http.send(req);
            System.debug('HTTP Response Status: ' + res.getStatus());
            System.debug('HTTP Response Body: ' + res.getBody());
        } catch (Exception e) {
            System.debug('HTTP Request Failed: ' + e.getMessage());
            throw new AuraHandledException('Error during the HTTP request: ' + e.getMessage());
        }
        
        // End of method
        System.debug('=== End of executeGraphQLQuery method ===');
        return res.getBody();  // Return the GraphQL response
    }
}