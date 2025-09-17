import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import FormInput from '../FormControls/FormInput';
import FormTextarea from '../FormControls/FormTextarea';
import { 
  fetchBusinessProfile, 
  createBusinessProfile, 
  updateBusinessProfile,
  clearError
} from '../../store/slices/businessProfileSlice';
import { 
  selectBusinessProfile, 
  selectBusinessProfileExists, 
  selectBusinessProfileStatus, 
  selectBusinessProfileError, 
  selectBusinessProfileMessage 
} from '../../store/slices/businessProfileSlice';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const BusinessProfileForm = () => {
  const dispatch = useDispatch();
  const profile = useSelector(selectBusinessProfile);
  const exists = useSelector(selectBusinessProfileExists);
  const status = useSelector(selectBusinessProfileStatus);
  const error = useSelector(selectBusinessProfileError);
  const message = useSelector(selectBusinessProfileMessage);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    company_logo: null,
    logoPreview: null,
    settings: {
      company_name: '',
      company_address: '',
      company_city: '',
      company_country: '',
      company_phone: '',
      company_email: '',
      company_website: '',
      company_reg_number: '',
      currency: 'KSH',
      invoice_footer: '',
      company_logo: null,
      logo_type: '',
      logo_name: ''
    }
  });

  const [isEditing, setIsEditing] = useState(false);

  // Fetch business profile on component mount
  useEffect(() => {
    dispatch(fetchBusinessProfile());
  }, [dispatch]);

  // Update form data when profile is fetched
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || '',
        company_logo: profile.company_logo || null,
        logoPreview: profile.company_logo ? `data:${profile.logo_type};base64,${btoa(String.fromCharCode(...new Uint8Array(profile.company_logo)))}` : null,
        settings: {
          company_name: profile.company_name || profile.name || '',
          company_address: profile.company_address || '',
          company_city: profile.company_city || '',
          company_country: profile.company_country || '',
          company_phone: profile.company_phone || '',
          company_email: profile.company_email || '',
          company_website: profile.company_website || '',
          company_reg_number: profile.company_reg_number || '',
          currency: profile.currency || 'KSH',
          invoice_footer: profile.invoice_footer || '',
          company_logo: profile.company_logo || null,
          logo_type: profile.logo_type || '',
          logo_name: profile.logo_name || ''
        }
      }));
    }
  }, [profile]);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (error || message) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, message, dispatch]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        // Keep company_name in sync with name field
        ...(field === 'name' && {
          settings: {
            ...prev.settings,
            company_name: value
          }
        })
      }));
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPEG, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          company_logo: file,
          logoPreview: e.target.result,
          settings: {
            ...prev.settings,
            company_logo: file,
            logo_type: file.type,
            logo_name: file.name
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({
      ...prev,
      company_logo: null,
      logoPreview: null,
      settings: {
        ...prev.settings,
        company_logo: null,
        logo_type: '',
        logo_name: ''
      }
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        name: formData.name,
        settings: {
          ...formData.settings,
          company_name: formData.name // Map the name to company_name
        }
      };

      // Add logo data if a new file was selected
      if (formData.settings.company_logo) {
        submitData.company_logo = formData.settings.company_logo;
        submitData.company_logo_type = formData.settings.logo_type;
        submitData.company_logo_name = formData.settings.logo_name;
      }

      if (exists) {
        await dispatch(updateBusinessProfile(submitData)).unwrap();
      } else {
        await dispatch(createBusinessProfile(submitData)).unwrap();
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving business profile:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to current profile data
    if (profile) {
      setFormData({
        name: profile.name || profile.company_name || '',
        company_logo: profile.company_logo || null,
        logoPreview: profile.company_logo ? `data:${profile.logo_type};base64,${btoa(String.fromCharCode(...new Uint8Array(profile.company_logo)))}` : null,
        settings: {
          company_name: profile.company_name || profile.name || '',
          company_address: profile.company_address || '',
          company_city: profile.company_city || '',
          company_country: profile.company_country || '',
          company_phone: profile.company_phone || '',
          company_email: profile.company_email || '',
          company_website: profile.company_website || '',
          company_reg_number: profile.company_reg_number || '',
          currency: profile.currency || 'KSH',
          invoice_footer: profile.invoice_footer || '',
          company_logo: profile.company_logo || null,
          logo_type: profile.logo_type || '',
          logo_name: profile.logo_name || ''
        }
      });
    }
  };

  const isLoading = status === 'loading';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Business Profile</CardTitle>
          {exists && !isEditing && (
            <Button onClick={handleEdit} variant="outline" size="sm" className="cursor-pointer">
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {status === 'loading' && !profile ? (
          <div className="text-center py-4">Loading business profile...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Company Name *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing && exists}
                required
              />
              
              <FormInput
                label="Company Registration Number"
                value={formData.settings.company_reg_number}
                onChange={(e) => handleInputChange('settings.company_reg_number', e.target.value)}
                disabled={!isEditing && exists}
              />
              
              <FormInput
                label="Phone Number"
                value={formData.settings.company_phone}
                onChange={(e) => handleInputChange('settings.company_phone', e.target.value)}
                disabled={!isEditing && exists}
              />
              
              <FormInput
                label="Email"
                type="email"
                value={formData.settings.company_email}
                onChange={(e) => handleInputChange('settings.company_email', e.target.value)}
                disabled={!isEditing && exists}
              />
              
              <FormInput
                label="Website"
                value={formData.settings.company_website}
                onChange={(e) => handleInputChange('settings.company_website', e.target.value)}
                disabled={!isEditing && exists}
              />
              
              <FormInput
                label="Currency"
                value={formData.settings.currency}
                onChange={(e) => handleInputChange('settings.currency', e.target.value)}
                disabled={!isEditing && exists}
              />
            </div>

            {/* Address */}
            <FormTextarea
              label="Company Address"
              value={formData.settings.company_address}
              onChange={(e) => handleInputChange('settings.company_address', e.target.value)}
              disabled={!isEditing && exists}
              rows={3}
            />

            {/* City and Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="City"
                value={formData.settings.company_city}
                onChange={(e) => handleInputChange('settings.company_city', e.target.value)}
                disabled={!isEditing && exists}
              />
              
              <FormInput
                label="Country"
                value={formData.settings.company_country}
                onChange={(e) => handleInputChange('settings.company_country', e.target.value)}
                disabled={!isEditing && exists}
              />
            </div>

                         {/* Logo Upload */}
             <div className="space-y-4">
               <label className="block text-sm font-medium text-gray-700">
                 Company Logo
               </label>
               
               {/* Logo Preview */}
               {formData.logoPreview && (
                 <div className="flex items-center space-x-4">
                   <div className="relative">
                     <img 
                       src={formData.logoPreview} 
                       alt="Company Logo" 
                       className="w-20 h-20 object-contain border border-gray-300 rounded-lg"
                     />
                     {(isEditing || !exists) && (
                       <button
                         type="button"
                         onClick={removeLogo}
                         className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                       >
                         <X className="h-4 w-4" />
                       </button>
                     )}
                   </div>
                   <div className="text-sm text-gray-500">
                     Current logo
                   </div>
                 </div>
               )}
               
               {/* Logo Upload Input - Show when editing OR when creating new profile */}
               {(isEditing || !exists) && (
                 <div className="space-y-2">
                   <input
                     ref={fileInputRef}
                     type="file"
                     name="company_logo"
                     accept="image/*"
                     onChange={handleLogoUpload}
                     className="hidden"
                     id="logo-upload"
                   />
                   <label
                     htmlFor="logo-upload"
                     className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                   >
                     <div className="text-center">
                       <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                       <p className="text-sm text-gray-600">
                         Click to upload logo or drag and drop
                       </p>
                       <p className="text-xs text-gray-500 mt-1">
                         PNG, JPG up to 5MB
                       </p>
                     </div>
                   </label>
                 </div>
               )}
             </div>

            {/* Invoice Footer */}
            <FormTextarea
              label="Invoice Footer Message"
              value={formData.settings.invoice_footer}
              onChange={(e) => handleInputChange('settings.invoice_footer', e.target.value)}
              disabled={!isEditing && exists}
              rows={2}
              placeholder="Thank you for your business!"
            />

            {/* Error and Success Messages */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">{message}</p>
              </div>
            )}

            {/* Action Buttons */}
            {!exists ? (
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                >
                  {isLoading ? 'Creating...' : 'Create Business Profile'}
                </Button>
              </div>
            ) : isEditing ? (
              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                >
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            ) : null}
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessProfileForm;
