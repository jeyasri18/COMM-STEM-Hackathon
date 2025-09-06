import React, { useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/supabase';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
`;

const Card = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #6c757d;
  margin-bottom: 40px;
  font-size: 1.1rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;
  &:focus {
    border-color: #667eea;
    outline: none;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
  min-height: 100px;
  resize: vertical;
  transition: all 0.2s ease;
  &:focus {
    border-color: #667eea;
    outline: none;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 20px;
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 14px;
  margin-top: 4px;
`;

const SuccessMessage = styled.div`
  color: #28a745;
  font-size: 14px;
  margin-top: 4px;
`;

const UploadClothing = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_per_day: '',
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [visibility, setVisibility] = useState('public');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!formData.title || !formData.price_per_day || !image) {
        throw new Error('Please fill in all required fields and select an image.');
      }
      const user = await getCurrentUser();
      if (!user) throw new Error('You must be signed in to upload.');
      // 1. Insert clothing item (with user_id, without image_url)
      const { data: item, error: insertError } = await supabase
        .from('clothing')
        .insert({
          title: formData.title,
          description: formData.description,
          price_per_day: parseFloat(formData.price_per_day),
          user_id: user.id,
          uploader_name: user.email,
          visibility,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      // 2. Upload image to storage
      const fileExt = image.name.split('.').pop();
      const fileName = `${item.id}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('clothing-images')
        .upload(fileName, image);
      if (uploadError) {
        console.error('Upload error:', uploadError.message);
        throw uploadError;
      }
      // 3. Get public URL
      const { data: publicUrlData, error: publicUrlError } = supabase.storage
        .from('clothing-images')
        .getPublicUrl(fileName);
      if (publicUrlError) {
        console.error('Get public URL error:', publicUrlError.message);
        throw publicUrlError;
      }
      const imageUrl = publicUrlData.publicUrl;
      // 4. Update clothing item with image URL
      const { error: updateError } = await supabase
        .from('clothing')
        .update({ image_url: imageUrl })
        .eq('id', item.id);
      if (updateError) {
        console.error('Update error:', updateError.message);
        throw updateError;
      }
      setSuccess('Clothing item uploaded successfully!');
      setFormData({ title: '', description: '', price_per_day: '' });
      setImage(null);
      setVisibility('public');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <Title>Upload Clothing</Title>
        <Subtitle>Share your clothes with others and earn money</Subtitle>
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>Title *</Label>
            <Input
              type="text"
              name="title"
              placeholder="e.g., Vintage Denim Jacket"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </InputGroup>
          <InputGroup>
            <Label>Description</Label>
            <TextArea
              name="description"
              placeholder="Describe the item, its condition, and any special features..."
              value={formData.description}
              onChange={handleInputChange}
            />
          </InputGroup>
          <InputGroup>
            <Label>Price per day *</Label>
            <Input
              type="number"
              name="price_per_day"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={formData.price_per_day}
              onChange={handleInputChange}
              required
            />
          </InputGroup>
          <InputGroup>
            <Label>Image *</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
          </InputGroup>
          <InputGroup>
            <Label>Visibility</Label>
            <select value={visibility} onChange={e => setVisibility(e.target.value)} style={{ padding: 8, borderRadius: 6 }}>
              <option value="public">Public (anyone can see)</option>
              <option value="community">Community (only your connections can see)</option>
            </select>
          </InputGroup>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Clothing Item'}
          </Button>
        </Form>
      </Card>
    </Container>
  );
};

export default UploadClothing;
