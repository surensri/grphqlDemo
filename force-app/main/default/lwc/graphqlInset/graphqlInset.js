import { LightningElement, track } from 'lwc';
import {gql,graphql} from 'lightning/uiGraphQLApi';
export default class GraphqlInset extends LightningElement {

    columns = [{
        label: 'Name',
        fieldName: 'Name',
        type: 'text',
        sortable: true
    },
    {
        label: 'Alias',
        fieldName: 'Alias',
        type: 'text',
        sortable: true
    },
    {
        label: 'State',
        fieldName: 'State',
        type: 'text',
        sortable: true
    },
    {
        label: 'Gender',
        fieldName: 'Gender',
        type: 'text',
        sortable: true
    },
];

strName;
strAlias;
strState;
strGender;
@track fields =[];

nameChangedHandler(event){
    this.strName = event.target.value;  
}
aliasChangedHandler(event){
    this.strAlias = event.target.value;
}
stateChangedHandler(event){
    this.strState = event.target.value;
}
genderChangedHandler(event){
    this.strGender = event.target.value;
}

handleClick(){
    if(this.strName  &&  this.strAlias  && this.strState  && this.strGender)
    {
        this.fields = [...this.fields,{'Name' : this.strName, 'Alias' : this.strAlias, 'State' : this.strState, 'Gender' : this.strGender}];   
    }
    this.strName ='';
    this.strAlias ='';
    this.strState ='';
    this.strGender= '';
    //code to clear field once values are entered
    this.template.querySelectorAll('lightning-input').forEach(element => {
    element.value = null;     
    });
}

}