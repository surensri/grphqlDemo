import { LightningElement, track } from 'lwc';

export default class GraphQLAccounts extends LightningElement {
  @track results;
  @track errors;

  connectedCallback() {
    this.fetchGraphQLData();
  }

  async fetchGraphQLData() {
    const graphQLQuery = `
      query AccountWithName {
        uiapi {
          query {
            Account(first:10) {
              edges {
                node {
                  Id
                  Name {
                    value
                  }
                }
              }
            }
          }
        }
      }`;

    const endpoint = '/services/data/v57.0/graphql';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + sessionStorage.getItem('salesforceSessionId')
        },
        body: JSON.stringify({ query: graphQLQuery })
      });

      if (response.ok) {
        const result = await response.json();
        this.results = result.data.uiapi.query.Account.edges.map((edge) => edge.node);
      } else {
        throw new Error('GraphQL query failed');
      }
    } catch (error) {
      this.errors = error;
      console.error('Error:', error);
    }
  }
}