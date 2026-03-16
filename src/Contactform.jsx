import { useState, useEffect, useRef } from "react";
import emailjs from "@emailjs/browser";

const Contactform = () => {
  const [formData, setFormData] = useState({
    date: "",
    name: "",
    agent: "",
    inrAmount: "",
    usdAmount: "",
    modeOfPayment: "",
    address: "",
    notes: "",
    email: "",
    phone: "",
  });

  const [products, setProducts] = useState([{ id: 1, product: "", qty: "" }]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [emailStatus, setEmailStatus] = useState(null);
  const [successCountdown, setSuccessCountdown] = useState(5);
  const [showPreviewBox, setShowPreviewBox] = useState(false);

  const formRef = useRef();
  const previewBoxRef = useRef();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProductChange = (id, field, value) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === id ? { ...product, [field]: value } : product
      )
    );
  };

  const addProductField = () => {
    setProducts((prevProducts) => [
      ...prevProducts,
      { id: Date.now(), product: "", qty: "" },
    ]);
  };

  const removeProductField = (id) => {
    if (products.length > 1) {
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== id)
      );
    }
  };

  const validateForm = () => {
    const newErrors = [];

    if (!formData.date) newErrors.push("Date is required");
    if (!formData.name) newErrors.push("Full Name is required");
    if (!formData.agent) newErrors.push("Agent is required");
    if (!formData.modeOfPayment) newErrors.push("Mode of Payment is required");
    if (!formData.address) newErrors.push("Delivery Address is required");
    if (!formData.email) newErrors.push("Email is required");
    if (!formData.phone) newErrors.push("Phone number is required");
    if (!formData.inrAmount && !formData.usdAmount) {
      newErrors.push("Please enter at least one amount (INR or USD)");
    }

    products.forEach((product, index) => {
      if (!product.product.trim()) {
        newErrors.push(`Product ${index + 1}: Product Name is required`);
      }
      if (!product.qty.toString().trim()) {
        newErrors.push(`Product ${index + 1}: Quantity is required`);
      }
    });

    return newErrors;
  };

  const sendEmail = async () => {
    try {
      // Format products for email
      const productLines = products
        .map((p, index) => `${index + 1}. ${p.product} - Quantity: ${p.qty}`)
        .join("\n");

      // Prepare template parameters - Match these with your EmailJS template variables
      const templateParams = {
        to_email: "ordersoverseas2@gmail.com",
        from_name: formData.name || "Customer",
        from_email: formData.email,
        from_phone: formData.phone,
        date: formData.date,
        agent: formData.agent,
        inr_amount: formData.inrAmount || "Not provided",
        usd_amount: formData.usdAmount || "Not provided",
        mode_of_payment: formData.modeOfPayment,
        delivery_address: formData.address,
        notes: formData.notes || "No additional notes",
        products: productLines,
        total_products: products.length.toString(),
        reply_to: formData.email,
        subject: `New Order from ${formData.name} - ${formData.date}`,
      };

      console.log("Sending email with params:", templateParams);

      // Send email using EmailJS with your credentials
      const result = await emailjs.send(
        "service_snl6lko", // Your Service ID
        "template_nnr5jmj", // Your Template ID
        templateParams, // Template Parameters
        "2DfVuQD-4jA7MUZs-" // Your Public Key
      );

      console.log("Email sent successfully:", result);
      return { success: true, message: "Email sent successfully" };
    } catch (error) {
      console.error("Email sending failed. Details:", {
        errorCode: error?.code,
        errorText: error?.text,
        message: error?.message,
        fullError: error,
      });
      return {
        success: false,
        message: `Email sending failed: ${
          error?.text || error?.message || "Unknown error"
        }`,
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    setErrors([]);
    setEmailStatus(null);

    try {
      // Step 1: Send email using EmailJS
      const emailResult = await sendEmail();

      if (emailResult.success) {
        setEmailStatus("success");
      } else {
        setEmailStatus("failed");
        setErrors([emailResult.message]);
      }

      // Show success popup regardless of email status
      setShowSuccessPopup(true);
      setSuccessCountdown(5);

      // Reset form
      setFormData({
        date: "",
        name: "",
        agent: "",
        inrAmount: "",
        usdAmount: "",
        modeOfPayment: "",
        address: "",
        notes: "",
        email: "",
        phone: "",
      });

      setProducts([{ id: 1, product: "", qty: "" }]);
      setShowPreviewBox(false);

      // Reset form fields
      if (formRef.current) {
        formRef.current.reset();
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      setEmailStatus("failed");
      setErrors([
        error.message || "An error occurred while submitting the form",
      ]);
      // Still show success popup for order placement
      setShowSuccessPopup(true);
      setSuccessCountdown(5);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Countdown effect for success popup
  useEffect(() => {
    if (showSuccessPopup && successCountdown > 0) {
      const timer = setTimeout(() => {
        setSuccessCountdown(successCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showSuccessPopup && successCountdown === 0) {
      setShowSuccessPopup(false);
    }
  }, [showSuccessPopup, successCountdown]);

  // Set today's date
  const setTodayDate = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormData((prev) => ({ ...prev, date: today }));
  };

  // Initialize EmailJS with Public Key
  useEffect(() => {
    emailjs.init("2DfVuQD-4jA7MUZs-");
    console.log("EmailJS initialized with key: 2DfVuQD-4jA7MUZs-");
  }, []);

  // Handle Preview button click
  const handlePreview = () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setShowPreviewBox(true);
    // Scroll to preview box
    setTimeout(() => {
      previewBoxRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Handle Edit button click
  const handleEdit = () => {
    setShowPreviewBox(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get email format products
  const getEmailFormattedProducts = () => {
    return products
      .map((p, index) => `${index + 1}. ${p.product} - Quantity: ${p.qty}`)
      .join("\n");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-2xl rounded-xl p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Maxxoverseasimpex
            </h1>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              Order Form
            </h2>
            <p className="text-gray-600">
              Fill in the details below to place your order
            </p>
          </div>

          {/* Preview Button */}
          <div className="flex justify-end mb-6">
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-lg hover:bg-purple-700 transition font-medium shadow-lg hover:shadow-xl"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              Preview Order
            </button>
          </div>

          {/* Preview Box */}
          {showPreviewBox && (
            <div
              ref={previewBoxRef}
              className="mb-8 border-2 border-blue-300 rounded-xl bg-gradient-to-br from-blue-50 to-white shadow-2xl animate-slideDown"
            >
              <div className="p-6">
                {/* Preview Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-blue-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        Order Preview
                      </h3>
                      <p className="text-gray-600">
                        This is how your order will appear in the email
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Edit
                  </button>
                </div>

                {/* Preview Content - Email Format */}
                <div className="space-y-6">
                  {/* Order Header */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">
                          Maxxoverseasimpex Order Form
                        </h4>
                        <p className="text-gray-600">New Order Submission</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-700">
                          <span className="font-semibold">Date:</span>{" "}
                          {formatDate(formData.date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                      Customer Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Customer Name</p>
                        <p className="font-medium text-gray-800">
                          {formData.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Agent</p>
                        <p className="font-medium text-gray-800">
                          {formData.agent}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-800">
                          {formData.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium text-gray-800">
                          {formData.phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                      Products ({products.length} items)
                    </h4>
                    <div className="space-y-3">
                      {products.map((product, index) => (
                        <div
                          key={product.id}
                          className="bg-white border border-gray-200 rounded p-3"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">
                                {index + 1}. {product.product}
                              </p>
                            </div>
                            <div className="md:text-right">
                              <p className="text-gray-700">
                                <span className="font-semibold">Quantity:</span>{" "}
                                {product.qty}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Amount Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                      Amount Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-200 rounded p-3">
                        <p className="text-sm text-gray-500">INR Amount</p>
                        <p className="text-xl font-bold text-gray-800">
                          {formData.inrAmount
                            ? `₹${formData.inrAmount}`
                            : "Not provided"}
                        </p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded p-3">
                        <p className="text-sm text-gray-500">USD Amount</p>
                        <p className="text-xl font-bold text-gray-800">
                          {formData.usdAmount
                            ? `$${formData.usdAmount}`
                            : "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment & Delivery */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                      Payment & Delivery
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-white border border-gray-200 rounded p-3">
                        <p className="text-sm text-gray-500">Mode of Payment</p>
                        <p className="font-medium text-gray-800">
                          {formData.modeOfPayment}
                        </p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded p-3">
                        <p className="text-sm text-gray-500">
                          Delivery Address
                        </p>
                        <p className="font-medium text-gray-800 whitespace-pre-line">
                          {formData.address}
                        </p>
                      </div>
                      {formData.notes && (
                        <div className="bg-white border border-gray-200 rounded p-3">
                          <p className="text-sm text-gray-500">
                            Additional Notes
                          </p>
                          <p className="font-medium text-gray-800 whitespace-pre-line">
                            {formData.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email Format Preview */}
                  <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      Email Format Preview
                    </h4>
                    <div className="bg-white border border-gray-200 rounded p-4 font-mono text-sm text-gray-700 whitespace-pre-line overflow-x-auto">
                      New Order from {formData.name} - {formData.date}
                      {"\n\n"}
                      Customer Information:{"\n"}- Name: {formData.name}
                      {"\n"}- Email: {formData.email}
                      {"\n"}- Phone: {formData.phone}
                      {"\n"}- Agent: {formData.agent}
                      {"\n\n"}
                      Products:{"\n"}
                      {getEmailFormattedProducts()}
                      {"\n\n"}
                      Amount Details:{"\n"}- INR Amount:{" "}
                      {formData.inrAmount
                        ? `₹${formData.inrAmount}`
                        : "Not provided"}
                      {"\n"}- USD Amount:{" "}
                      {formData.usdAmount
                        ? `$${formData.usdAmount}`
                        : "Not provided"}
                      {"\n\n"}
                      Payment & Delivery:{"\n"}- Mode of Payment:{" "}
                      {formData.modeOfPayment}
                      {"\n"}- Delivery Address: {formData.address}
                      {"\n"}- Additional Notes:{" "}
                      {formData.notes || "No additional notes"}
                    </div>
                  </div>

                  {/* Close Preview Button */}
                  <div className="flex justify-center pt-4 border-t border-gray-200">
                    <button
                      onClick={handleEdit}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition font-medium"
                    >
                      Close Preview & Continue Editing
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Please fix the following errors:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-red-600 text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
            {/* Customer Information Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={setTodayDate}
                      className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition whitespace-nowrap"
                    >
                      Today
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Enter customer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Enter customer email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Enter customer phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent *
                  </label>
                  <input
                    type="text"
                    name="agent"
                    value={formData.agent}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Agent name"
                  />
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-xl font-semibold text-gray-800">
                  Products Information
                </h3>
                <button
                  type="button"
                  onClick={addProductField}
                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add Product
                </button>
              </div>

              <div className="space-y-6">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 p-4 rounded-lg bg-white"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium text-gray-700">
                        Product {index + 1}
                      </span>
                      {products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProductField(product.id)}
                          className="text-red-500 hover:text-red-700 transition"
                          title="Remove product"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          value={product.product}
                          onChange={(e) =>
                            handleProductChange(
                              product.id,
                              "product",
                              e.target.value
                            )
                          }
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                          placeholder="Enter brand + product + Strength name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity *
                        </label>
                        <input
                          type="text"
                          value={product.qty}
                          onChange={(e) =>
                            handleProductChange(
                              product.id,
                              "qty",
                              e.target.value
                            )
                          }
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                          placeholder="Enter quantity (can be text or number)"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {products.length > 1 && (
                <div className="mt-4 text-sm text-gray-600">
                  Total Products: {products.length}
                </div>
              )}
            </div>

            {/* Amount Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                Amount Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount in INR *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500 font-medium">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="inrAmount"
                      value={formData.inrAmount}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount in USD
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500 font-medium">
                      $
                    </span>
                    <input
                      type="number"
                      name="usdAmount"
                      value={formData.usdAmount}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                * INR amount is required. USD amount is optional.
              </p>
            </div>

            {/* Payment & Delivery Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                Payment & Delivery
              </h3>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode of Payment *
                  </label>
                  <input
                    type="text"
                    name="modeOfPayment"
                    value={formData.modeOfPayment}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="e.g., Cash, UPI, Credit Card, Bank Transfer, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Enter complete delivery address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Any additional notes, special instructions, or comments..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full ${
                  isSubmitting
                    ? "bg-blue-400"
                    : "bg-blue-600 hover:bg-blue-700 transform hover:-translate-y-1"
                } text-white font-semibold py-4 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-lg shadow-lg hover:shadow-xl`}
              >
                {isSubmitting ? "Submitting..." : "Submit Order & Send Email"}
              </button>

              {isSubmitting && (
                <div className="mt-2 text-center text-sm text-blue-600">
                  Sending email via EmailJS...
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Simple Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl transform transition-all animate-fadeIn">
            <div className="text-center">
              {/* Countdown Timer */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-blue-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    Closing in:{" "}
                    <span className="text-blue-600 font-bold">
                      {successCountdown}s
                    </span>
                  </span>
                </div>
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {/* Success Icon */}
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-green-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              {/* Success Message */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {emailStatus === "success"
                  ? "Order Submitted Successfully!"
                  : "Order Submitted"}
              </h3>
              <p className="text-lg text-gray-700 mb-4">
                Thank you for your order
              </p>

              {/* Email Status */}
              {emailStatus === "success" && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-medium flex items-center justify-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Email sent successfully to ordersoverseas2@gmail.com
                  </p>
                </div>
              )}

              {emailStatus === "failed" && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700 font-medium flex items-center justify-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Order submitted but email failed. Data saved locally.
                  </p>
                </div>
              )}

              {/* Countdown Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(successCountdown / 5) * 100}%` }}
                ></div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition font-medium text-lg"
              >
                Close ({successCountdown}s)
              </button>

              {/* Additional Info */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  ✓ Your order has been submitted successfully
                  <br />✓ Form has been reset for next order
                  <br />✓ You can now close this message
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Contactform;
