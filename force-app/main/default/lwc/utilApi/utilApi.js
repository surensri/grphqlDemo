import { LightningElement } from 'lwc';

export async function postData({ headers, apiEndpoint, apibody }) {
    const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: headers,
        body: apibody
    });
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    return response.json();
}