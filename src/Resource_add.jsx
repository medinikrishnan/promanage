import React, { useState } from "react";
import axios from "axios";

const AddResource = ({ projectId }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [requiredQuantity, setRequiredQuantity] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newResource = {
      project_id: projectId,
      name,
      type,
      available_quantity: availableQuantity,
      required_quantity: requiredQuantity,
    };

    axios.post("/api/resources", newResource)
      .then(response => {
        alert("Resource added successfully");
      })
      .catch(error => {
        console.error("Error adding resource", error);
        alert("Failed to add resource");
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Name:</label>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      <label>Type:</label>
      <input type="text" value={type} onChange={(e) => setType(e.target.value)} required />
      <label>Available Quantity:</label>
      <input type="number" value={availableQuantity} onChange={(e) => setAvailableQuantity(e.target.value)} required />
      <label>Required Quantity:</label>
      <input type="number" value={requiredQuantity} onChange={(e) => setRequiredQuantity(e.target.value)} required />
      <button type="submit">Add Resource</button>
    </form>
  );
};

export default AddResource;
