export async function fetchMessagesAndSubscription(
    jwt,
    updateChat,
    updateSubscriptionAmount
) {
    try {
        // Retrieve the projectId from local storage
        const projectId = localStorage.getItem('selectedProjectId') || null;

        // Construct the URL with the projectId as a query parameter
        let url = '/api/user/messages-and-subscription';
        if (projectId) {
            url += `?projectId=${projectId}`;
        }

        // Make the request to the server
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${jwt}` },
        });

        const data = response.data;
        updateChat(
            data.messages.filter((message) => message.role !== 'system')
        );
        updateSubscriptionAmount(data.subscriptionAmount);

        return data;
    } catch (error) {
        console.error('Error fetching messages and subscription:', error);
    }
}

export async function sendMessage(message, projectId, jwt) {
    try {
        await axios.post(
            '/api/cerebrum_v1',
            { message: message, projectId: projectId },
            { headers: { Authorization: `Bearer ${jwt}` } }
        );
    } catch (error) {
        console.error('Error:', error);
    }
}

export async function fetchProjects(jwt, isLoggedIn) {
    if (!isLoggedIn()) {
        return [];
    }
    try {
        const response = await axios.get('/api/user/projects', {
            headers: { Authorization: `Bearer ${jwt}` },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching projects:', error);
        return []; // Return an empty array in case of an error
    }
}

export async function fetchUserDetails(jwt) {
    try {
        const response = await axios.get('/api/user/details', {
            headers: { Authorization: `Bearer ${jwt}` },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching user details:', error);
        return null; // Return null in case of an error
    }
}

export async function fetchSubscriptionTiers() {
    try {
        const response = await axios.get('/api/tiers');
        return response.data;
    } catch (error) {
        console.error('Error fetching subscription tiers:', error);
        return []; // Return an empty array in case of an error
    }
}

export async function fetchPasswordResetToken(token) {
    try {
        const response = await axios.get(`/reset-password?token=${token}`);

        return response.data;
    } catch (error) {
        console.error('Error fetching reset token:', error);
        return []; // Return an empty array in case of an error
    }
}

export async function deleteProject(projectId, jwt) {
    try {
        // Send DELETE request to the server to delete the project
        const response = await axios.delete('/api/cerebrum_v1/project', {
            data: { projectId: projectId },
            headers: { Authorization: `Bearer ${jwt}` },
        });

        // Check if the deletion was successful and update UI accordingly
        if (response.status === 200) {
            alert('Project successfully deleted.');
        } else {
            alert('Failed to delete the project.');
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('An error occurred while deleting the project.');
    }
}

export async function selectPlan(
    planType,
    planAmount,
    jwt,
    populateUserDetails
) {
    try {
        // POST request to the server to update the subscription
        const response = await axios.post(
            '/api/user/subscription',
            {
                type: planType,
                amount: planAmount,
            },
            {
                headers: { Authorization: `Bearer ${jwt}` },
            }
        );

        // Check if the subscription was updated successfully and update UI accordingly
        if (response.data) {
            alert(`Subscription updated to ${planType}.`);
            await populateUserDetails(); // Refresh user details in UI
        }
    } catch (error) {
        console.error('Error updating subscription:', error);
        alert('Failed to update subscription.');
    }
}
