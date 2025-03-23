import { LightningElement, track, wire} from 'lwc';
import executeGraphQLQuery from '@salesforce/apex/ApiCallForGraphQL.executeGraphQLQuery';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { gql, graphql } from 'lightning/uiGraphQLApi';

export default class ManageAccountsAndContactsWithGraphQL extends LightningElement {
    @track accountName = '';
    @track siteValue = '';
    @track phoneValue = '';
    @track websiteValue = '';
    @track contactName = '';
    @track contactPhone = '';
    @track contactSalutation = '';
    @track selectedAccountId = '';
    @track accountOptions = [];
    @track message = '';
    @track error = '';

    @track accountLookupName = '';
    @track errors = '';
    @track message = '';
    @track error = '';
    @track data = [];

    columns = [
        { label: 'Name', fieldName: 'Name', type: 'text' },
        { label: 'Accoun Site', fieldName: 'AccountSite', type: 'text' },
        { label: 'Phone', fieldName: 'Phone', type: 'Phone' },
        { label: 'Website', fieldName: 'Website', type: 'URL' },
        { label: 'Contact Name', fieldName: 'ContactName', type: 'text' },
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

    salutationOptions = [
        { label: 'Mr.', value: 'Mr.' },
        { label: 'Ms.', value: 'Ms.' },
        { label: 'Mrs.', value: 'Mrs.' },
        { label: 'Dr.', value: 'Dr.' }
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
                                    Contacts {
                                        edges {
                                            node {
                                                FirstName { value }
                                                LastName { value }
                                            }
                                        }
                                    }
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
                this.data = responseData.data.uiapi.query.Account.edges.map(acc => {
                    // Fetch contact names associated with the account
                    const contactNames = acc.node.Contacts.edges.map(contact => 
                        `${contact.node.FirstName.value} ${contact.node.LastName.value}`
                    ).join(', ');
    
                    return {
                        Id: acc.node.Id,
                        Name: acc.node.Name.value,
                        AccountSite: acc.node.Site.value,
                        Phone: acc.node.Phone.value,
                        Website: acc.node.Website.value,
                        ContactName: contactNames || 'No Contacts', 
                        CreatedDate: new Date(acc.node.CreatedDate.value) // Convert to Date object for sorting
                    };
                }).sort((a, b) => b.CreatedDate - a.CreatedDate);
            })
            .catch(error => {
                this.error = 'Error fetching data: ' + error.body.message;
                console.error('Error fetching GraphQL data:', error);
            });
    }
    

   /* @wire(graphql, {
        query: gql`
            query AllAccounts {
                uiapi {
                    query {
                        Account(first: 100, orderBy: {Name: {order: ASC}}) {
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
            }
        `
    })
    graphqlQueryResult({ data, errors }) {
        if (data) {
            const allAccounts = data.uiapi.query.Account.edges.map(edge => ({
                label: edge.node.Name.value,
                value: edge.node.Id
            }));

            // Filter accounts based on the input value
            this.accountOptions = allAccounts.filter(account =>
                account.label.toLowerCase().includes(this.accountLookupName.toLowerCase())
            );
        }
        if (errors) {
            this.errors = 'Error fetching accounts: ' + errors.message;
            console.error('Error fetching accounts:', errors);
        }
    }*/


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

    handleAccountSiteChange(event) {
        this.siteValue = event.target.value;
    }

    handleAccountPhoneChange(event) {
        this.phoneValue = event.target.value;
    }

    handleWebsiteChange(event) {
        this.webValue = event.target.value;
    }

    // Handle input change for account deletion
    handleAccountIdChange(event) {
        this.accountId = event.target.value; // Set the account ID for deletion
    }

    // Method to handle the changes for the contact fields
    handleFirstNameChange(event) {
        this.firstName = event.target.value;
    }
    
    handleLastNameChange(event) {
        this.lastName = event.target.value;
    }
    
    handleSalutationChange(event) {
        this.contactSalutation = event.target.value;
    }
    
    handleAccountSelect(event) {
        this.selectedAccountId = event.detail.value;
    }

    handleInserAccountandContactClick() {
        // Validate required fields
        if (!this.accountName || !this.siteValue || !this.phoneValue || !this.webValue || !this.firstName || !this.lastName || !this.contactSalutation) {
            this.error = 'Please fill in all required fields.';
            this.showWarningToast();
            return;
        }
    
        // Step 1: Insert the Account Record
        const accountMutation = `
            mutation {
                uiapi {
                    AccountCreate(input: {
                        Account: {
                            Name: "${this.accountName}",
                            Site: "${this.siteValue}",
                            Phone: "${this.phoneValue}",
                            Website: "${this.webValue}"
                        }
                    }) {
                        Record {
                            Id
                            Name { value }
                            Site { value }
                            Phone { value }
                            Website { value }
                        }
                    }
                }
            }
        `;
    
        executeGraphQLQuery({ query: accountMutation })
            .then(result => {
                const responseData = JSON.parse(result);
                const newAccount = responseData.data.uiapi.AccountCreate.Record;
    
                // Step 2: Insert the Contact Record with the new AccountId
                const contactMutation = `
                    mutation {
                        uiapi {
                            ContactCreate(input: {
                                Contact: {
                                    Salutation: "${this.contactSalutation}",
                                    FirstName: "${this.firstName}",
                                    LastName: "${this.lastName}",
                                    AccountId: "${newAccount.Id}"
                                }
                            }) {
                                Record {
                                    Id
                                    FirstName { value }
                                    LastName { value }
                                    Account {
                                        Id
                                        Name { value }
                                    }
                                }
                            }
                        }
                    }
                `;
    
                return executeGraphQLQuery({ query: contactMutation })
                    .then(result => {
                        const responseData = JSON.parse(result);
                        const newContact = responseData.data.uiapi.ContactCreate.Record;
    
                        // Step 3: Update the Data Table
                        const newRecord = {
                            Id: newAccount.Id,
                            Name: newAccount.Name.value,
                            AccountSite: newAccount.Site.value,
                            Phone: newAccount.Phone.value,
                            Website: newAccount.Website.value,
                            ContactName: `${newContact.FirstName.value} ${newContact.LastName.value}`,
                            CreatedDate: new Date() // Use current date for the new record
                        };
    
                        this.data = [newRecord, ...this.data];
                        this.clearInputFields();
                        this.clearContactInputFields();
    
                        // Show success toast message
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success',
                                message: 'Account and Contact created successfully!',
                                variant: 'success',
                            })
                        );
                    });
            })
            .catch(error => {
                console.error('GraphQL Error:', error); // Log the complete error object
                // Extract detailed error message if available
                let errorMessage = 'Unknown error';
                if (error && error.body) {
                    errorMessage = error.body.message || error.body;
                } else if (error.message) {
                    errorMessage = error.message;
                }
                this.error = 'Error: ' + errorMessage;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: this.error,
                        variant: 'error',
                    })
                );
            });
    }
    showWarningToast() {
        const evt = new ShowToastEvent({
            title: 'Missing Fields',
            message: 'Please fill in all required fields.',
            variant: 'warning',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }
    
    
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'delete') {
            this.executeGraphQLDelete(row.Id);
        }
    }

    executeGraphQLDelete(accountId) {
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

        executeGraphQLQuery({ query: mutation })
            .then(result => {
                const responseData = JSON.parse(result);
                if (responseData.data.uiapi.AccountDelete.Id === accountId) {
                    // Remove the deleted record from the datatable
                    this.data = this.data.filter(record => record.Id !== accountId);
                    
                    // Show success toast message
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Account deleted successfully!',
                            variant: 'success',
                        })
                    );
                } else {
                    console.error('Delete operation failed.');
                    this.error = 'Delete operation failed.';
                }
            })
            .catch(error => {
                console.error('GraphQL Error:', error);
                let errorMessage = 'Unknown error';
                if (error && error.body) {
                    errorMessage = error.body.message || error.body;
                } else if (error.message) {
                    errorMessage = error.message;
                }
                this.error = 'Error: ' + errorMessage;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: this.error,
                        variant: 'error',
                    })
                );
            });
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
        
    clearContactInputFields() {
        this.contactSalutation = '';
        this.firstName = '';
        this.lastName = '';
        this.selectedAccountId = '';
    
        // Clear input fields in the template
        const inputFields = this.template.querySelectorAll('lightning-input, lightning-combobox');
        if (inputFields) {
            inputFields.forEach(field => {
                field.value = ''; // Clear the input value
            });
        }
    }
    

    // Handle insert account
    /*handleInsertClick() {
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

    handleInserContactClick() {
        console.log('Selected Account ID:', this.selectedAccountId);
        // Validate the required fields
        const firstNameInput = this.template.querySelector('lightning-input[label="First Name"]');
        const lastNameInput = this.template.querySelector('lightning-input[label="Last Name"]');
        const accountLookupInput = this.template.querySelector('lightning-combobox[label="Account Name for Contact"]');
    
        if (!this.firstName || !this.lastName || !this.selectedAccountId) {
            this.error = 'Please fill in all required fields.';
            return;
        }
    
        // GraphQL mutation for Contact creation
        const mutation = `
            mutation {
                uiapi {
                    ContactCreate(input: {
                        Contact: {
                            Salutation: "${this.contactSalutation}",
                            FirstName: "${this.firstName}",
                            LastName: "${this.lastName}",
                            AccountId: "${this.selectedAccountId}"
                        }
                    }) {
                        Record {
                            Id
                            FirstName { value }
                            LastName { value }
                            Account {
                                Id
                                Name { value }
                            }
                        }
                    }
                }
            }
        `;
    
        this.executeGraphQL(mutation, 'Contact created successfully!', true, 'insertContact');
    }
    // Unified executeGraphQL function for both insert and delete
    executeGraphQL(query, successMessage, refreshTable = false, operation = '') {
        executeGraphQLQuery({ query })
            .then(result => {
                let responseData;
                try {
                    responseData = JSON.parse(result);
                } catch (e) {
                    console.error('Error parsing GraphQL result:', e);
                    this.error = 'Error parsing result.';
                    return;
                }
    
                console.log('GraphQL Mutation Result:', responseData);
    
                if (operation === 'insert') {
                    const record = responseData.data?.uiapi?.AccountCreate?.Record;
                    if (record) {
                        const newRecord = {
                            Id: record.Id,
                            Name: record.Name?.value,
                            AccountSite: record.Site?.value,
                            Phone: record.Phone?.value,
                            Website: record.Website?.value,
                        };
    
                        this.data = [newRecord, ...this.data];
                        // Update accountOptions to include newly created account
                this.accountOptions = [...this.accountOptions, {
                    label: newRecord.Name,
                    value: newRecord.Id
                }];
                        this.clearInputFields();
                    } else {
                        console.error('No record data found');
                        this.error = 'No record data found.';
                    }
                }
    
                if (operation === 'insertContact') {
                    const record = responseData.data?.uiapi?.ContactCreate?.Record;
                    if (record) {
                        const newContact = {
                            Id: record.Id,
                            ContactName: `${record.FirstName?.value} ${record.LastName?.value}`,
                            AccountId: record.Account?.Id
                        };
    
                        this.data = this.data.map(account => {
                            if (account.Id === newContact.AccountId) {
                                return {
                                    ...account,
                                    ContactName: newContact.ContactName
                                };
                            }
                            return account;
                        });
    
                        this.clearContactInputFields();
                    } else {
                        console.error('No contact data found');
                        this.error = 'No contact data found.';
                    }
                }
                // Show success toast message
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: successMessage,
                    variant: 'success',
                })
            );
    
                if (refreshTable) {
                    this.fetchGraphQLData(); // Re-fetch updated data after mutation
                }
    
                this.message = successMessage;
                this.error = '';
            })
            
            .catch(error => {
                console.error('GraphQL Error:', JSON.stringify(error));
    
                let errorMessage = 'An unknown error occurred';
    
                if (error && error.body) {
                    if (error.body.message) {
                        errorMessage = error.body.message;
                    } else if (typeof error.body === 'string') {
                        errorMessage = error.body;
                    }
                } else if (error.message) {
                    errorMessage = error.message;
                }
    
                this.message = '';
                this.error = errorMessage;
    
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: this.error,
                        variant: 'error',
                    })
                );
            });
    }*/
     
}