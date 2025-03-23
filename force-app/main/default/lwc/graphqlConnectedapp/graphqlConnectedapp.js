import { LightningElement } from 'lwc';
import executeGraphQLQuery from '@salesforce/apex/ApiCallForGraphQL.executeGraphQLQuery';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class ManageAccountsWithGraphQL extends LightningElement {
    // Separate variables for account name and account ID
    accountName = '';
    aliasValue = ''; // Alias
    stateValue = ''; // State
    genderValue = ''; // Gender
    accountId = '';
    message = '';
    error = '';
    data = [];
    //isComponentInitialized = false; // To track initialization

    columns = [
        { label: 'Name', fieldName: 'Name', type: 'text' },
        { label: 'Alias', fieldName: 'Alias', type: 'text' },
        { label: 'State', fieldName: 'State', type: 'text' },
        { label: 'Gender', fieldName: 'Gender', type: 'text' },
        {
            type: 'button-icon',
            typeAttributes: {
                iconName: 'utility:delete',
                name: 'delete',
                title: 'Delete',
                variant: 'border-filled',
                alternativeText: 'Delete',
                iconClass: 'slds-icon-text-error'
            }
        }
    ];

    connectedCallback() {
       // this.isComponentInitialized = true;
        this.fetchGraphQLData();
    }

     // This lifecycle hook runs when the component is re-rendered after each render cycle.
     /*renderedCallback() {
        if (!this.isComponentInitialized) {
            this.fetchGraphQLData();
            this.isComponentInitialized = true; // Ensure this is only called once per render
        }
    }*/

    fetchGraphQLData() {
        const query = `
            query {
                uiapi {
                    query {
                        Account(first: 100) {
                            edges {
                                node {
                                    Id
                                    Name { value }
                                    Alias__c { value }
                                    State__c { value }
                                    Gender__c { value }
                                }
                            }
                        }
                    }
                }
            }
        `;
        executeGraphQLQuery({ query })
            .then(result => {
                const responseData = JSON.parse(result);
                this.data = responseData.data.uiapi.query.Account.edges.map(acc => ({
                    Id: acc.node.Id,
                    Name: acc.node.Name.value,
                    Alias: acc.node.Alias__c.value,
                    State: acc.node.State__c.value,
                    Gender: acc.node.Gender__c.value,
                }));
               // localStorage.setItem('accountRecords', JSON.stringify(this.data));
            })
            .catch(error => {
                this.error = 'Error fetching data: ' + error.body.message;
                console.error('Error fetching GraphQL data:', error);
            });
    }
    // Handle input change for account creation
    handleAccountNameChange(event) {
        this.accountName = event.target.value; // Set the account name for creation
    }

    handleAliasChange(event) {
        this.aliasValue = event.target.value;
    }

    handleStateChange(event) {
        this.stateValue = event.target.value;
    }

    handleGenderChange(event) {
        this.genderValue = event.target.value;
    }

    // Handle input change for account deletion
    handleAccountIdChange(event) {
        this.accountId = event.target.value; // Set the account ID for deletion
    }

    // Handle insert account
    handleInsertClick() {
        if (!this.accountName) {
            this.error = 'Please enter an account name';
            this.message = '';
            return;
        }

        const mutation = `
            mutation {
                uiapi {
                    AccountCreate(input: {
                        Account: {
                            Name: "${this.accountName}"
                            Alias__c: "${this.aliasValue}",
                            State__c: "${this.stateValue}",
                            Gender__c: "${this.genderValue}"
                        }
                    }) {
                        Record {
                            Id
                            Name {
                                value
                            }
                            Alias__c {
                                value
                            }
                            State__c {
                                value
                            }
                            Gender__c {
                                value
                            }
                        }
                    }
                }
            }
        `;
        this.executeGraphQL(mutation, 'Account created successfully!',true, 'insert');
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'delete') {
            this.deleteAccount(row.Id);
        }
    }

    // Handle delete account
    deleteAccount(accountId) {
        const mutation = `
            mutation {
                uiapi {
                    AccountDelete(input: {
                        Id: "${accountId}"
                    }) {
                        Id
                    }
                }
            }
        `;
        this.executeGraphQL(mutation, 'Account deleted successfully!',true, 'delete');
    }

    // Unified executeGraphQL function for both insert and delete
    executeGraphQL(query, successMessage, refreshTable = false, operation = '') {
        executeGraphQLQuery({ query })
            .then(result => {
                const responseData = JSON.parse(result);
                console.log('GraphQL Response:', responseData);

                // Display success message in toast
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: successMessage,
                        variant: 'success',
                    })
                );
                if (operation === 'insert') {
                    const newRecord = {
                        Id: responseData.data.uiapi.AccountCreate.Record.Id,
                        Name: responseData.data.uiapi.AccountCreate.Record.Name.value,
                        Alias: responseData.data.uiapi.AccountCreate.Record.Alias__c.value,
                        State: responseData.data.uiapi.AccountCreate.Record.State__c.value,
                        Gender: responseData.data.uiapi.AccountCreate.Record.Gender__c.value,
                    };
                    // Create a new array reference to trigger reactivity
                    this.data = [...this.data, newRecord];
                }
                // Force data refresh after insert or delete
                if (refreshTable) {
                    this.fetchGraphQLData(); // Re-fetch updated data after mutation
                }

                this.message = successMessage;
                this.error = '';
            })
            .catch(error => {
                console.error('GraphQL Error:', error);
                this.message = '';
                this.error = 'Error: ' + error.body.message;

                // Show error message in toast
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: this.error,
                        variant: 'error',
                    })
                );
            });
    }
    // Execute the GraphQL query/mutation
    /*executeGraphQL(query, successMessage, isInsert) {
        executeGraphQLQuery({ query })
            .then(result => {
                const responseData = JSON.parse(result);
                console.log('GraphQL Response:', responseData);

                if (isInsert && responseData.data.uiapi.AccountCreate) {
                    // Add the newly created account to the datatable
                    const newRecord = {
                        Id: responseData.data.uiapi.AccountCreate.Record.Id,
                        Name: responseData.data.uiapi.AccountCreate.Record.Name.value,
                        Alias: responseData.data.uiapi.AccountCreate.Record.Alias__c.value,
                        State: responseData.data.uiapi.AccountCreate.Record.State__c.value,
                        Gender: responseData.data.uiapi.AccountCreate.Record.Gender__c.value,
                    };
                    this.data = [...this.data, newRecord]; // Append the new record to the data array

                    // Save the updated data in local storage
                   // localStorage.setItem('accountRecords', JSON.stringify(this.data));
                }

                if (!isInsert && responseData.data.uiapi.AccountDelete) {
                    // Remove the deleted record from the datatable
                    this.data = this.data.filter(record => record.Id !== this.accountId);

                    // Save the updated data in local storage
                    //localStorage.setItem('accountRecords', JSON.stringify(this.data));
                }

                this.message = successMessage;
                this.error = '';
            })
            .catch(error => {
                console.error('GraphQL Error:', error);
                this.message = '';
                this.error = 'Error: ' + error.body.message;
            });
    }*/
}