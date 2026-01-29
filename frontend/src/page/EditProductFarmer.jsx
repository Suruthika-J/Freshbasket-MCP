// frontend/src/page/EditProductFarmer.jsx
import React from "react";
import { useParams } from "react-router-dom";

const EditProductFarmer = () => {
  const { id } = useParams();

  return (
    <div style={{ padding: "20px" }}>
      <h2>Edit Product</h2>
      <p>Product ID: {id}</p>
    </div>
  );
};

export default EditProductFarmer;
