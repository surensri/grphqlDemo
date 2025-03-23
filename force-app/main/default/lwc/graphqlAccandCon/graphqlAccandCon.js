import { LightningElement, track, api  } from 'lwc';
import executeGraphQLQuery from '@salesforce/apex/ApiCallForGraphQL.executeGraphQLQuery';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class ManageAccountsWithGraphQL extends LightningElement {
   
    @track accountName = '';
    @track siteValue = '';
    @track phoneValue = '';
    @track webValue = '';
    @track accountNameError = false;
    @track accountNameErrorMessage = '';
    @track accountNameErrorClass = '';
    @track accountId = '';
    @track message = '';
    @track error = '';
    @track data = [];
    
    columns = [
        { label: 'Name', fieldName: 'Name', type: 'text' },
        { label: 'Accoun Site', fieldName: 'AccounSite', type: 'text' },
        { label: 'Phone', fieldName: 'Phone', type: 'Phone' },
        { label: 'Website', fieldName: 'Website', type: 'URL' },
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
   
        this.fetchGraphQLData();
    }

    fetchGraphQLData() {
        const query = `
            query {
                uiapi {
                    query {
                        Account(first: 20) {
                            edges {
                                node {
                                    Id
                                    Name { value }
                                    Site { value }
                                    Phone { value }
                                    Website { value }
                                    CreatedDate { value }
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
                    AccounSite: acc.node.Site.value,
                    Phone: acc.node.Phone.value,
                    Website: acc.node.Website.value,
                    CreatedDate: new Date(acc.node.CreatedDate.value) // Convert to Date object for sorting
                })).sort((a, b) => b.CreatedDate - a.CreatedDate);
            })
            .catch(error => {
                this.error = 'Error fetching data: ' + error.body.message;
                console.error('Error fetching GraphQL data:', error);
            });
    }


    // Handle input change for account creation
    handleAccountNameChange(event) {
        this.accountName = event.target.value; 
        this.clearAccountNameError(); // Clear any previous error
    }
    clearAccountNameError() {
        this.accountNameError = false;
        this.accountNameErrorMessage = '';
        this.accountNameErrorClass = '';
    }

    handleAliasChange(event) {
        this.siteValue = event.target.value;
    }

    handleStateChange(event) {
        this.phoneValue = event.target.value;
    }

    handleGenderChange(event) {
        this.webValue = event.target.value;
    }

    // Handle input change for account deletion
    handleAccountIdChange(event) {
        this.accountId = event.target.value; // Set the account ID for deletion
    }

    // Handle insert account
    handleInsertClick() {
        const accountNameInput = this.template.querySelector('lightning-input[label="Account Name"]');

        if (!this.accountName) {
            this.accountNameError = true;
            this.accountNameErrorMessage = 'Account Name is required.';
            this.accountNameErrorClass = 'slds-has-error';
            accountNameInput.setCustomValidity('Please enter an account name');
            accountNameInput.reportValidity(); 
            return;
        } else {
            this.clearAccountNameError();
        }
        const mutation = `
            mutation {
                uiapi {
                    AccountCreate(input: {
                        Account: {
                            Name: "${this.accountName}"
                            Site: "${this.siteValue}",
                            Phone: "${this.phoneValue}",
                            Website: "${this.webValue}"
                        }
                    }) {
                        Record {
                            Id
                            Name {value}
                            Site {value}
                            Phone {value}
                            Website {value}
                        }
                    }
                }
            }
        `;
        this.executeGraphQL(mutation, 'Account created successfully!',true, 'insert');
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
                    //console.log('Newly created record:', responseData.data.uiapi.AccountCreate.Record);
                    const newRecord = {
                        Id: responseData.data.uiapi.AccountCreate.Record.Id,
                        Name: responseData.data.uiapi.AccountCreate.Record.Name.value,
                        AccounSite: responseData.data.uiapi.AccountCreate.Record.Site.value,
                        Phone: responseData.data.uiapi.AccountCreate.Record.Phone.value,
                        Website: responseData.data.uiapi.AccountCreate.Record.Website.value,
                    };
                    
                    // Create a new array reference to trigger reactivity
                    this.data = [newRecord, ...this.data];
                    this.clearInputFields();
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

    // Clear the input fields after inserting a record
    clearInputFields() {
        this.accountName = '';
        this.siteValue = '';
        this.phoneValue = '';
        this.webValue = '';

        // Reset input fields in the template by targeting them through their 'name' attribute
        const inputFields = this.template.querySelectorAll('lightning-input');
        if (inputFields) {
            inputFields.forEach(field => {
                field.value = ''; // Clear the input value
            });
        }
    }    
}