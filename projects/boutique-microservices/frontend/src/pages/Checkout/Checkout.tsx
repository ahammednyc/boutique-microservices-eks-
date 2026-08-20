import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  TextField,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { LocalShipping as ShippingIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { orderService } from '../../services/orderService';

interface ShippingForm {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const emptyForm: ShippingForm = {
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'United States',
};

const Checkout: React.FC = () => {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<ShippingForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    navigate('/cart', { replace: true });
    return null;
  }

  const subtotal = total;
  const shipping = subtotal > 500 ? 0 : 15;
  const tax = subtotal * 0.08;
  const finalTotal = subtotal + shipping + tax;

  const handleChange = (field: keyof ShippingForm) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const isValid = form.street && form.city && form.state && form.zipCode && form.country;

  const handlePlaceOrder = async () => {
    if (!isValid) {
      setError('Please fill in all shipping fields.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await orderService.createOrder({
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        shippingAddress: form,
      });
      clearCart();
      navigate('/orders', { state: { orderPlaced: true } });
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Something went wrong placing your order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Checkout
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Enter your shipping details to complete your order
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <ShippingIcon color="secondary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Shipping Address
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Street Address"
                    fullWidth
                    required
                    value={form.street}
                    onChange={handleChange('street')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="City"
                    fullWidth
                    required
                    value={form.city}
                    onChange={handleChange('city')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    label="State"
                    fullWidth
                    required
                    value={form.state}
                    onChange={handleChange('state')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    label="ZIP Code"
                    fullWidth
                    required
                    value={form.zipCode}
                    onChange={handleChange('zipCode')}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Country"
                    fullWidth
                    required
                    value={form.country}
                    onChange={handleChange('country')}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Box sx={{ mt: 3 }}>
              <Button variant="outlined" href="/cart" sx={{ px: 3 }}>
                Back to Cart
              </Button>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: 24 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Order Summary
              </Typography>

              <Box sx={{ mb: 2 }}>
                {items.map((item) => (
                  <Box
                    key={item.id}
                    sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {item.name} × {item.quantity}
                    </Typography>
                    <Typography variant="body2">
                      $
                      {(
                        (typeof item.price === 'string'
                          ? parseFloat(item.price)
                          : item.price) * item.quantity
                      ).toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Subtotal:</Typography>
                <Typography variant="body1">${subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Shipping:</Typography>
                <Typography variant="body1">
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Tax:</Typography>
                <Typography variant="body1">${tax.toFixed(2)}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Total:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#d4af37' }}>
                  ${finalTotal.toFixed(2)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="secondary"
                size="large"
                fullWidth
                disabled={submitting}
                onClick={handlePlaceOrder}
                sx={{ py: 1.5 }}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Place Order'}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Checkout;