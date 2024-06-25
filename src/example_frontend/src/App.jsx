import React, { useState, useEffect } from 'react';
import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";
import { example_backend } from 'declarations/example_backend';
import './index.scss';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [principal, setPrincipal] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [showUpdateCustomerForm, setShowUpdateCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', address: '' });
  const [currentCustomer, setCurrentCustomer] = useState(null);
  
  const authClientPromise = AuthClient.create();

  const signIn = async () => {
    const authClient = await authClientPromise;
    const internetIdentityUrl = process.env.NODE_ENV === 'production'
      ? undefined
      : `http://localhost:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}`;

    await new Promise((resolve) => {
      authClient.login({
        identityProvider: internetIdentityUrl,
        onSuccess: () => resolve(undefined),
      });
    });

    const identity = authClient.getIdentity();
    updateIdentity(identity);
    setIsLoggedIn(true);
  };

  const signOut = async () => {
    const authClient = await authClientPromise;
    await authClient.logout();
    updateIdentity(null);
  };

  const updateIdentity = (identity) => {
    if (identity) {
      setPrincipal(identity.getPrincipal());
      const agent = new HttpAgent();
      const actor = Actor.createActor(example_backend, { agent: agent });
      example_backend.setActor(actor);
    } else {
      setPrincipal(null);
      example_backend.setActor(null);
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      const authClient = await authClientPromise;
      const isAuthenticated = await authClient.isAuthenticated();
      setIsLoggedIn(isAuthenticated);
      if (isAuthenticated) {
        const identity = authClient.getIdentity();
        updateIdentity(identity);
      }
    };

    checkLoginStatus();
  }, []);

  const fetchCustomers = async () => {
    try {
      const customersList = await example_backend.getCustomers();
      console.log("Fetched customers:", customersList);
      setCustomers(customersList);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const handleAddCustomer = async (event) => {
    event.preventDefault();
    console.log("Submitting customer:", newCustomer);

    try {
      await example_backend.addCustomer(newCustomer.name, newCustomer.email, newCustomer.address);
      console.log("Customer added successfully");
      setNewCustomer({ name: '', email: '', address: '' });
      setShowAddCustomerForm(false);
      fetchCustomers();
    } catch (error) {
      console.error("Failed to add customer:", error);
    }
  };

  const handleUpdateCustomer = async (event) => {
    event.preventDefault();
    console.log("Updating customer:", currentCustomer);

    try {
      await example_backend.updateCustomer(currentCustomer.id, currentCustomer.name, currentCustomer.email, currentCustomer.address);
      console.log("Customer updated successfully");
      setCurrentCustomer(null);
      setShowUpdateCustomerForm(false);
      fetchCustomers();
    } catch (error) {
      console.error("Failed to update customer:", error);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    try {
      await example_backend.deleteCustomer(customerId);
      console.log("Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      console.error("Failed to delete customer:", error);
    }
  };

  const handleViewCustomers = () => {
    // Fetch customers only if the list is empty or needs to be updated
    if (customers.length === 0) {
      fetchCustomers();
    }
    setShowAddCustomerForm(false);
    setShowUpdateCustomerForm(false); // Ensure update form is closed
  };

  const handleEditCustomer = (customer) => {
    setCurrentCustomer(customer);
    setShowUpdateCustomerForm(true);
    setShowAddCustomerForm(false); // Close add form if open
  };

  return (
    <main>
      <h1>Customer Management System</h1>
      {isLoggedIn ? (
        <>
          <p>Welcome back, {principal ? principal.toString() : "User"}!</p>
          <button onClick={signOut}>Sign Out</button>
          <button onClick={() => setShowAddCustomerForm(true)}>Add New Customer</button>
          <button onClick={handleViewCustomers}>View Customers</button>
          <h2>Customer List</h2>
          {!showAddCustomerForm && (
            <ul>
              {customers.map((customer, index) => (
                <li key={index}>
                  {customer.name} - {customer.email} - {customer.address}
                  <button onClick={() => handleEditCustomer(customer)}>Edit</button>
                  <button onClick={() => handleDeleteCustomer(customer.id)}>Delete</button>
                </li>
              ))}
            </ul>
          )}
          {showAddCustomerForm && (
            <form onSubmit={handleAddCustomer}>
              <label>
                Name:
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  required
                />
              </label>
              <label>
                Address:
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  required
                />
              </label>
              <button type="submit">Save Customer</button>
            </form>
          )}
          {showUpdateCustomerForm && currentCustomer && (
            <form onSubmit={handleUpdateCustomer}>
              <label>
                Name:
                <input
                  type="text"
                  value={currentCustomer.name}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  value={currentCustomer.email}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, email: e.target.value })}
                  required
                />
              </label>
              <label>
                Address:
                <input
                  type="text"
                  value={currentCustomer.address}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, address: e.target.value })}
                  required
                />
              </label>
              <button type="submit">Update Customer</button>
            </form>
          )}
        </>
      ) : (
        <button onClick={signIn}>Sign In</button>
      )}
    </main>
  );
}

export default App;
