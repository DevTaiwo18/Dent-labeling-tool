import React, { useState, useRef, useEffect } from 'react';

const Toast = ({ message, type, onClose }) => (
  <div
    className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-xl p-8 max-w-md mx-4 relative"
      onClick={e => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-3 text-gray-900">
          {type === 'error' ? 'Alert' : 'Success'}
        </h2>
        <p className="text-gray-600 text-lg">
          {message}
        </p>
      </div>
    </div>
  </div>
);

function Appraiser() {
  // Form and UI state
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const dropZoneRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [toast, setToast] = useState(null);

  // Damage categories state
  const [damageCategories, setDamageCategories] = useState([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const [itemsByCategory, setItemsByCategory] = useState({});
  const [selectedItemsByCategory, setSelectedItemsByCategory] = useState({});

  // Validation state - Added policyholder required fields
  const [validationErrors, setValidationErrors] = useState({
    insurance_company: false,
    insurance_claim_number: false,
    date_of_claim: false,
    policyholder_first_name: false,
    policyholder_last_name: false,
    policyholder_email: false,
    adjuster_first_name: false,
    adjuster_last_name: false,
    adjuster_email: false
  });

  // Form refs for validation scrolling - Added policyholder refs
  const formRefs = {
    insurance_company: useRef(),
    insurance_claim_number: useRef(),
    date_of_claim: useRef(),
    policyholder_first_name: useRef(),
    policyholder_last_name: useRef(),
    policyholder_email: useRef(),
    adjuster_first_name: useRef(),
    adjuster_last_name: useRef(),
    adjuster_email: useRef()
  };

  // Helper functions
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const resetFileInput = () => {
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const getSelectedItemsCount = () => {
    return Object.values(selectedItemsByCategory).reduce((total, items) => {
      return total + items.length;
    }, 0);
  };

  const prepareSelectedDamageItems = () => {
    const selectedItemIds = [];
    Object.entries(selectedItemsByCategory).forEach(([categoryId, items]) => {
      items.forEach(item => {
        selectedItemIds.push(item.id);
      });
    });
    return selectedItemIds;
  };

  // Damage Categories API functions
  const fetchDamageCategories = async () => {
    setIsFetchingCategories(true);

    try {
      const response = await fetch('https://racial-ivette-jmccottry-c0386bc9.koyeb.app/get-damage-categories/1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();

        if (data && data.data) {
          setDamageCategories(data.data);

          const initialItemsByCategory = {};
          data.data.forEach(category => {
            initialItemsByCategory[category.id] = [];
            fetchDamageItems(category.id);
          });

          setItemsByCategory(initialItemsByCategory);
        } else {
          showToast('Failed to load damage categories', 'error');
        }
      } else {
        showToast('Failed to load damage categories', 'error');
      }
    } catch (error) {
      showToast('Error loading damage categories', 'error');
    } finally {
      setIsFetchingCategories(false);
    }
  };

  const fetchDamageItems = async (categoryId) => {
    try {
      const response = await fetch(`https://racial-ivette-jmccottry-c0386bc9.koyeb.app/get-damage-items/${categoryId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();

        if (data && data.data) {
          const items = Array.isArray(data.data.items) ? data.data.items.map(item => ({
            ...item,
            category_id: categoryId,
            id: item.id
          })) : [];

          setItemsByCategory(prev => ({
            ...prev,
            [categoryId]: items
          }));
        }
      }
    } catch (error) {
      setItemsByCategory(prev => ({
        ...prev,
        [categoryId]: []
      }));
    }
  };

  const handleItemCheck = (categoryId, item) => {
    setSelectedItemsByCategory((prev) => {
      const currentSelectedItems = prev[categoryId] || [];
      const isAlreadySelected = currentSelectedItems.some((i) => i.id === item.id);

      let updatedItems;
      if (isAlreadySelected) {
        updatedItems = currentSelectedItems.filter((i) => i.id !== item.id);
      } else {
        updatedItems = [...currentSelectedItems, {
          ...item,
          category_id: categoryId
        }];
      }

      return {
        ...prev,
        [categoryId]: updatedItems,
      };
    });
  };

  // File handling functions
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processFileData = (data) => {
    const mappedData = {
      insurance_company: data.insuranceCompany || '',
      insurance_claim_number: data.claimNumber || '',
      date_of_claim: data.dateOfClaim || '',
      policyholder_first_name: data.client?.first_name || '',
      policyholder_last_name: data.client?.last_name || '',
      policyholder_email: data.client?.contact_information?.email || '',
      policyholder_phone: data.client?.contact_information?.phone_number || '',
      policyholder_address1: data.client?.contact_information?.address || '',
      policyholder_city: data.client?.contact_information?.city || '',
      policyholder_state: data.client?.contact_information?.state || '',
      policyholder_zip: data.client?.contact_information?.zip || '',
      _originalData: data
    };

    setFormData(mappedData);
    showToast('PDF processed successfully!', 'success');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);

    const formDataForPDF = new FormData();
    formDataForPDF.append('pdfFile', file);

    try {
      const response = await fetch('https://mutual-cecilla-jmccottry-33ae7687.koyeb.app/api/readpdf', {
        method: 'POST',
        headers: {
          'x-api-key': '8977227a6a8252faf44d301cbedacd034cfc5b019831574f5e4b23bc649cd729',
        },
        body: formDataForPDF,
      });

      if (response.ok) {
        const data = await response.json();
        processFileData(data);
      } else {
        showToast('Failed to process PDF', 'error');
      }
    } catch (error) {
      showToast('Error processing PDF', 'error');
    } finally {
      setIsLoading(false);
      resetFileInput();
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);

    const formDataForPDF = new FormData();
    formDataForPDF.append('pdfFile', file);

    try {
      const response = await fetch('https://mutual-cecilla-jmccottry-33ae7687.koyeb.app/api/readpdf', {
        method: 'POST',
        headers: {
          'x-api-key': '8977227a6a8252faf44d301cbedacd034cfc5b019831574f5e4b23bc649cd729',
        },
        body: formDataForPDF,
      });

      if (response.ok) {
        const data = await response.json();
        processFileData(data);
      } else {
        showToast('Failed to process PDF', 'error');
      }
    } catch (error) {
      showToast('Error processing PDF', 'error');
    } finally {
      setIsLoading(false);
      resetFileInput();
    }
  };

  const handleCreatePublicClaim = async () => {
    // Updated validation to include policyholder required fields
    const newErrors = {
      insurance_company: false,
      insurance_claim_number: false,
      date_of_claim: false,
      policyholder_first_name: false,
      policyholder_last_name: false,
      policyholder_email: false,
      adjuster_first_name: false,
      adjuster_last_name: false,
      adjuster_email: false
    };

    if (!formData.insurance_company) newErrors.insurance_company = true;
    if (!formData.insurance_claim_number) newErrors.insurance_claim_number = true;
    if (!formData.date_of_claim) newErrors.date_of_claim = true;
    if (!formData.policyholder_first_name) newErrors.policyholder_first_name = true;
    if (!formData.policyholder_last_name) newErrors.policyholder_last_name = true;
    if (!formData.policyholder_email) newErrors.policyholder_email = true;
    if (!formData.adjuster_first_name) newErrors.adjuster_first_name = true;
    if (!formData.adjuster_last_name) newErrors.adjuster_last_name = true;
    if (!formData.adjuster_email) newErrors.adjuster_email = true;

    setValidationErrors(newErrors);

    if (Object.values(newErrors).some(error => error === true)) {
      const firstErrorField = Object.keys(newErrors).find(key => newErrors[key] === true);
      if (firstErrorField && formRefs[firstErrorField].current) {
        formRefs[firstErrorField].current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        formRefs[firstErrorField].current.focus();
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedItemIds = prepareSelectedDamageItems();

      const claimData = {
        insurance_company: formData.insurance_company,
        insurance_claim_number: formData.insurance_claim_number,
        claim_description: "Collision Damage",
        date_of_claim: formData.date_of_claim,
        claim_status: "Initiated",
        policyholder_first_name: formData.policyholder_first_name,
        policyholder_last_name: formData.policyholder_last_name,
        policyholder_email: formData.policyholder_email,
        policyholder_phone: formData.policyholder_phone || '',
        policyholder_address1: formData.policyholder_address1 || '',
        policyholder_address2: formData.policyholder_address2 || '',
        policyholder_city: formData.policyholder_city || '',
        policyholder_state: formData.policyholder_state || '',
        policyholder_zip: formData.policyholder_zip || '',
        adjuster_first_name: formData.adjuster_first_name,
        adjuster_last_name: formData.adjuster_last_name,
        adjuster_email: formData.adjuster_email,
        damageItems: selectedItemIds
      };

      const response = await fetch('https://racial-ivette-jmccottry-c0386bc9.koyeb.app/create-public-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(claimData)
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitSuccess(true);
        showToast('Collision appraisal created successfully! Link sent to adjuster.', 'success');

        setFormData({});
        setSelectedFile(null);
        setSelectedItemsByCategory({});

        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      } else {
        throw new Error('Failed to create claim');
      }

    } catch (error) {
      showToast('Error creating collision appraisal', 'error');
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDamageCategories = () => {
    return (
      <div className="mt-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-700">Select Damage Items</h3>
          <div className="px-3 py-1 bg-orange-50 rounded-full text-sm font-medium text-orange-600">
            {getSelectedItemsCount()} Items Selected
          </div>
        </div>

        <div className="space-y-8">
          {damageCategories.map((category) => {
            const categoryItems = itemsByCategory[category.id] || [];
            const selectedItems = selectedItemsByCategory[category.id] || [];

            return (
              <div key={category.id} className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">
                    {category.category_name}
                  </h4>
                  <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full">
                    {selectedItems.length}/{categoryItems.length} selected
                  </span>
                </div>

                <div className="bg-white rounded-lg p-4">
                  {categoryItems.length === 0 ? (
                    <div className="py-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-500 mx-auto mb-2"></div>
                      Loading items...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryItems.map((item) => {
                        const isChecked = selectedItems.some(
                          (selected) => selected.id === item.id
                        );

                        return (
                          <label
                            key={item.id}
                            className="flex items-center gap-3 text-gray-700 cursor-pointer p-3 hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-300 transition-all duration-200"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleItemCheck(category.id, item)}
                              className="w-4 h-4 border-2 border-orange-200 rounded text-orange-500 focus:ring-orange-200 focus:ring-offset-0 transition-colors duration-200"
                            />
                            <span className="select-none text-sm font-medium">{item.item_name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // useEffect hooks
  useEffect(() => {
    const div = dropZoneRef.current;
    if (div) {
      div.addEventListener('dragover', handleDragOver);
      div.addEventListener('drop', handleDrop);

      return () => {
        div.removeEventListener('dragover', handleDragOver);
        div.removeEventListener('drop', handleDrop);
      };
    }
  }, []);

  useEffect(() => {
    fetchDamageCategories();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600 sm:text-5xl">
            Vehicle Collision Appraisal
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Upload collision documents and create a secure verification link for your claimant
          </p>
        </div>

        {/* PDF Upload Section */}
        <div className="mb-8">
          <div
            className="relative border-2 border-dashed border-orange-300 rounded-xl p-8 text-center bg-white hover:border-orange-400 transition-colors duration-200"
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-lg text-gray-600 mb-4">
                  Drag and drop your collision report PDF here or
                </p>
                <label className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg shadow-lg transition-all duration-200 cursor-pointer">
                  Choose File
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500">PDF files only, up to 10MB</p>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-800 font-medium">
                Selected File: <span className="font-normal">{selectedFile.name}</span>
              </p>
            </div>
          )}

          {isLoading && (
            <div className="mt-4 flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mr-3"></div>
              <span className="text-orange-600 font-medium">Processing PDF...</span>
            </div>
          )}
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          {/* Insurance Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Insurance Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="insurance_company" className="block text-sm font-semibold text-gray-700">
                  Insurance Company *
                </label>
                <input
                  ref={formRefs.insurance_company}
                  type="text"
                  id="insurance_company"
                  placeholder="e.g., Public Call"
                  value={formData.insurance_company || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      insurance_company: e.target.value,
                    });
                    setValidationErrors(prev => ({
                      ...prev,
                      insurance_company: e.target.value.length === 0
                    }));
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors ${validationErrors.insurance_company ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                />
                {validationErrors.insurance_company && (
                  <p className="text-red-600 text-sm font-medium">Insurance Company is required</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="insurance_claim_number" className="block text-sm font-semibold text-gray-700">
                  Claim Number *
                </label>
                <input
                  ref={formRefs.insurance_claim_number}
                  type="text"
                  id="insurance_claim_number"
                  placeholder="e.g., 333-444-666"
                  value={formData.insurance_claim_number || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      insurance_claim_number: e.target.value,
                    });
                    setValidationErrors(prev => ({
                      ...prev,
                      insurance_claim_number: e.target.value.length === 0
                    }));
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors ${validationErrors.insurance_claim_number ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                />
                {validationErrors.insurance_claim_number && (
                  <p className="text-red-600 text-sm font-medium">Claim Number is required</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="date_of_claim" className="block text-sm font-semibold text-gray-700">
                  Date of Claim *
                </label>
                <input
                  ref={formRefs.date_of_claim}
                  type="text"
                  id="date_of_claim"
                  placeholder="e.g., 03/28/2023"
                  value={formData.date_of_claim || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      date_of_claim: e.target.value,
                    });
                    setValidationErrors(prev => ({
                      ...prev,
                      date_of_claim: e.target.value.length === 0
                    }));
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors ${validationErrors.date_of_claim ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                />
                {validationErrors.date_of_claim && (
                  <p className="text-red-600 text-sm font-medium">Date of Claim is required</p>
                )}
              </div>
            </div>
          </div>

          {/* Policyholder Information - Updated with required fields */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Policyholder Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="policyholder_first_name" className="block text-sm font-semibold text-gray-700">
                  First Name *
                </label>
                <input
                  ref={formRefs.policyholder_first_name}
                  type="text"
                  id="policyholder_first_name"
                  placeholder="e.g., Eric"
                  value={formData.policyholder_first_name || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      policyholder_first_name: e.target.value,
                    });
                    setValidationErrors(prev => ({
                      ...prev,
                      policyholder_first_name: e.target.value.length === 0
                    }));
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors ${validationErrors.policyholder_first_name ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                />
                {validationErrors.policyholder_first_name && (
                  <p className="text-red-600 text-sm font-medium">First Name is required</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="policyholder_last_name" className="block text-sm font-semibold text-gray-700">
                  Last Name *
                </label>
                <input
                  ref={formRefs.policyholder_last_name}
                  type="text"
                  id="policyholder_last_name"
                  placeholder="e.g., Gullien"
                  value={formData.policyholder_last_name || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      policyholder_last_name: e.target.value,
                    });
                    setValidationErrors(prev => ({
                      ...prev,
                      policyholder_last_name: e.target.value.length === 0
                    }));
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors ${validationErrors.policyholder_last_name ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                />
                {validationErrors.policyholder_last_name && (
                  <p className="text-red-600 text-sm font-medium">Last Name is required</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="policyholder_email" className="block text-sm font-semibold text-gray-700">
                  Email *
                </label>
                <input
                  ref={formRefs.policyholder_email}
                  type="email"
                  id="policyholder_email"
                  placeholder="e.g., test123@gmail.com"
                  value={formData.policyholder_email || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      policyholder_email: e.target.value,
                    });
                    setValidationErrors(prev => ({
                      ...prev,
                      policyholder_email: e.target.value.length === 0
                    }));
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors ${validationErrors.policyholder_email ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                />
                {validationErrors.policyholder_email && (
                  <p className="text-red-600 text-sm font-medium">Email is required</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="policyholder_phone" className="block text-sm font-semibold text-gray-700">
                  Phone
                </label>
                <input
                  type="text"
                  id="policyholder_phone"
                  placeholder="e.g., 3023945867"
                  value={formData.policyholder_phone || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      policyholder_phone: e.target.value,
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 hover:border-gray-400 transition-colors"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="policyholder_address1" className="block text-sm font-semibold text-gray-700">
                  Address 1
                </label>
                <input
                  type="text"
                  id="policyholder_address1"
                  placeholder="e.g., 456 Blue St."
                  value={formData.policyholder_address1 || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      policyholder_address1: e.target.value,
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 hover:border-gray-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="policyholder_address2" className="block text-sm font-semibold text-gray-700">
                  Address 2
                </label>
                <input
                  type="text"
                  id="policyholder_address2"
                  placeholder="e.g., Suite 7"
                  value={formData.policyholder_address2 || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      policyholder_address2: e.target.value,
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 hover:border-gray-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="policyholder_city" className="block text-sm font-semibold text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  id="policyholder_city"
                  placeholder="e.g., Reston"
                  value={formData.policyholder_city || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      policyholder_city: e.target.value,
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 hover:border-gray-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="policyholder_state" className="block text-sm font-semibold text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  id="policyholder_state"
                  placeholder="e.g., VA"
                  value={formData.policyholder_state || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      policyholder_state: e.target.value,
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 hover:border-gray-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="policyholder_zip" className="block text-sm font-semibold text-gray-700">
                  ZIP Code
                </label>
                <input
                  type="text"
                  id="policyholder_zip"
                  placeholder="e.g., 20912"
                  value={formData.policyholder_zip || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      policyholder_zip: e.target.value,
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 hover:border-gray-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Adjuster Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Adjuster Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="adjuster_first_name" className="block text-sm font-semibold text-gray-700">
                  Adjuster First Name *
                </label>
                <input
                  ref={formRefs.adjuster_first_name}
                  type="text"
                  id="adjuster_first_name"
                  placeholder="e.g., Krys"
                  value={formData.adjuster_first_name || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      adjuster_first_name: e.target.value,
                    });
                    setValidationErrors(prev => ({
                      ...prev,
                      adjuster_first_name: e.target.value.length === 0
                    }));
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors ${validationErrors.adjuster_first_name ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                />
                {validationErrors.adjuster_first_name && (
                  <p className="text-red-600 text-sm font-medium">Adjuster First Name is required</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="adjuster_last_name" className="block text-sm font-semibold text-gray-700">
                  Adjuster Last Name *
                </label>
                <input
                  ref={formRefs.adjuster_last_name}
                  type="text"
                  id="adjuster_last_name"
                  placeholder="e.g., Drake"
                  value={formData.adjuster_last_name || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      adjuster_last_name: e.target.value,
                    });
                    setValidationErrors(prev => ({
                      ...prev,
                      adjuster_last_name: e.target.value.length === 0
                    }));
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors ${validationErrors.adjuster_last_name ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                />
                {validationErrors.adjuster_last_name && (
                  <p className="text-red-600 text-sm font-medium">Adjuster Last Name is required</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="adjuster_email" className="block text-sm font-semibold text-gray-700">
                  Adjuster Email *
                </label>
                <input
                  ref={formRefs.adjuster_email}
                  type="email"
                  id="adjuster_email"
                  placeholder="e.g., kdrake@gmail.com"
                  value={formData.adjuster_email || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      adjuster_email: e.target.value,
                    });
                    setValidationErrors(prev => ({
                      ...prev,
                      adjuster_email: e.target.value.length === 0
                    }));
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors ${validationErrors.adjuster_email ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                />
                {validationErrors.adjuster_email && (
                  <p className="text-red-600 text-sm font-medium">Adjuster Email is required</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Damage Categories Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Damage Categories
            </h2>
            <p className="text-gray-600">
              Select the damage items that apply to this collision claim.
            </p>
          </div>

          {isFetchingCategories ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mr-3"></div>
              <span className="text-orange-600 font-medium">Loading damage categories...</span>
            </div>
          ) : damageCategories.length > 0 ? (
            renderDamageCategories()
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No damage categories available</p>
              <button
                onClick={() => fetchDamageCategories()}
                className="px-5 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                Retry Loading Categories
              </button>
            </div>
          )}
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-green-800">Collision Appraisal Created Successfully!</h3>
                <p className="text-green-700 mt-1">
                  A secure verification link has been sent to the adjuster. The claimant will receive instructions to complete their vehicle verification.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleCreatePublicClaim}
            disabled={isSubmitting || getSelectedItemsCount() === 0}
            className={`
              inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white 
              rounded-xl shadow-lg transition-all duration-200 space-x-3
              ${getSelectedItemsCount() === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
              }
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : !isSubmitting && getSelectedItemsCount() > 0 ? 'transform hover:scale-105' : ''}
            `}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating Collision Appraisal...</span>
              </>
            ) : getSelectedItemsCount() === 0 ? (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Select Damage Items to Continue</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Create Collision Appraisal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Appraiser;