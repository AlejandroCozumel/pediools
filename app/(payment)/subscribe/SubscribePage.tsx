'use client'

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const SubscribePage = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubscribe = async (priceId: string) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: user?.id }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error('Error:', error);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error:', err);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Choose Your Subscription</h1>
      <div>
        <h2>Monthly Plan</h2>
        <p>$19.99/month</p>
        <button
          onClick={() => handleSubscribe('price_1QdvlrJOM1rSKNWLcgV22wSk')}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Subscribe Monthly'}
        </button>
      </div>
      <div>
        <h2>Annual Plan</h2>
        <p>$199.99/year</p>
        <button
          onClick={() => handleSubscribe('price_yearly_id_from_stripe')}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Subscribe Annually'}
        </button>

      </div>
    </div>
  );
};

export default SubscribePage;