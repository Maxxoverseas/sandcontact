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
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [excelData, setExcelData] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [emailStatus, setEmailStatus] = useState(null);

  const formRef = useRef();

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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(excelData);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const sendEmail = async () => {
    try {
      // Format products for email
      const productLines = products
        .map((p, index) => `${index + 1}. ${p.product} - Quantity: ${p.qty}`)
        .join("\n");

      // Prepare template parameters
      const templateParams = {
        to_email: "ordersoverseas2@gmail.com",
        date: formData.date,
        customer_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        agent: formData.agent,
        inr_amount: formData.inrAmount
          ? `₹${formData.inrAmount}`
          : "Not provided",
        usd_amount: formData.usdAmount
          ? `$${formData.usdAmount}`
          : "Not provided",
        mode_of_payment: formData.modeOfPayment,
        delivery_address: formData.address,
        notes: formData.notes || "No additional notes",
        products: productLines,
        total_products: products.length,
        order_summary: excelData, // Include the full formatted data
      };

      // Send email using EmailJS
      const result = await emailjs.send(
        "service_8zmgj4g",
        "template_ysxq49l",
        templateParams,
        "2DfVuQD-4jA7MUZs-"
      );

      console.log("Email sent successfully:", result.text);
      return true;
    } catch (error) {
      console.error("Email sending failed:", error);
      return false;
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
      // Format the data for Excel
      const productLines = products.map((p) => ({
        product: p.product.trim(),
        qty: p.qty.toString().trim(),
      }));

      // Create Excel format data
      const excelFormattedData = `Date: ${formData.date}
Customer Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}
Agent: ${formData.agent}
INR Amount: ₹${formData.inrAmount || "0"}
USD Amount: $${formData.usdAmount || "0"}
Mode of Payment: ${formData.modeOfPayment}
Delivery Address: ${formData.address}
Notes: ${formData.notes || "No notes"}

--- PRODUCTS ---
${productLines.map((p) => `• ${p.product} (Qty: ${p.qty})`).join("\n")}

Total Products: ${products.length}`;

      // Set Excel data
      setExcelData(excelFormattedData);

      // Send email using EmailJS
      const emailSent = await sendEmail();
      setEmailStatus(emailSent ? "success" : "failed");

      // Show success popup
      setShowPopup(true);
      setCountdown(5);

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
    } catch (error) {
      console.error("Error:", error);
      setErrors([error.message || "An error occurred"]);
      setEmailStatus("failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Countdown effect
  useEffect(() => {
    if (showPopup && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showPopup && countdown === 0) {
      setShowPopup(false);
    }
  }, [showPopup, countdown]);

  // Set today's date
  const setTodayDate = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormData((prev) => ({ ...prev, date: today }));
  };

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init("2DfVuQD-4jA7MUZs-");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-3 text-sm text-gray-500">
                      INR
                    </span>
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
                    <span className="absolute right-3 top-3 text-sm text-gray-500">
                      USD
                    </span>
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
                } text-white font-semibold py-4 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-lg`}
              >
                {isSubmitting ? "Submitting..." : "Submit Order & Send Email"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Popup */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl transform transition-all animate-fadeIn">
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
                      {countdown}s
                    </span>
                  </span>
                </div>
                <button
                  onClick={() => setShowPopup(false)}
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

              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-green-600"
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

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {emailStatus === "success"
                  ? "Order Placed & Email Sent!"
                  : emailStatus === "failed"
                  ? "Order Saved but Email Failed!"
                  : "Order Placed Successfully!"}
              </h3>

              {emailStatus === "success" && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-700 text-sm">
                    ✓ Email sent to ordersoverseas2@gmail.com using EmailJS
                  </p>
                </div>
              )}

              {emailStatus === "failed" && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-700 text-sm">
                    ⚠ Email sending failed. Data copied below for manual
                    sending.
                  </p>
                </div>
              )}

              <p className="text-gray-600 text-sm mb-4">
                Your order has been submitted.
              </p>

              {/* Countdown Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${(countdown / 5) * 100}%` }}
                ></div>
              </div>

              {/* Excel Data */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-700">Order Data:</h4>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition text-sm"
                  >
                    {copySuccess ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                        <span className="font-medium">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="overflow-hidden">
                  <pre className="text-xs bg-white p-3 rounded border whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-hidden">
                    {excelData}
                  </pre>
                </div>

                <div className="mt-2 text-xs text-gray-500 text-center">
                  All data visible above | Characters: {excelData.length}
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowPopup(false)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                  Close ({countdown}s)
                </button>
                <button
                  onClick={() => setCountdown(5)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium text-sm flex items-center justify-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Reset
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  ✅ Copy the data above to use in Excel
                  <br />✅ Form has been reset for next order
                  <br />✅ Email sent via EmailJS service
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
      `}</style>
    </div>
  );
};

export default Contactform;
