import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const VerifyClient = () => {
  const [verificationCode, setVerificationCode] = useState(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  // Create refs for each input
  const inputRefs = useRef([...Array(6)].map(() => React.createRef()));

  useEffect(() => {
    if (!email) {
      setTimeout(() => {
        navigate('/signup');
      }, 100);
    }
  }, [email, navigate]);

  const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '';

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (isLoading) return;
  const token = verificationCode.join('');
  if (!/^\d{6}$/.test(token)) {
    toast.error("Enter the complete six-digit code from your email.");
    return;
  }
  setIsLoading(true);

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/verifyClient?token=${token}`,
      {
        method: "POST"
      }
    );

    setIsLoading(false);

    if (response.ok) {
      toast.success("Registration successful! Please login.", {
        duration: 3000,
      });

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } else {
      toast.error("Invalid verification code. Please try again.", {
        duration: 3000,
      });
      setVerificationCode(Array(6).fill(''));
    }

  } catch (error) {
    setIsLoading(false);
    toast.error("Verification failed. Please try again.", {
      duration: 3000,
    });
    console.error("Verification error:", error);
  }
};

  const handleResendCode = async (e) => {
    e.preventDefault();
    if (isLoading || !email) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/resendCodeClient?email=${encodeURIComponent(email)}`, {
        method: "POST"
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error([404, 503].includes(response.status) ? message : 'Could not resend the code. Please try again.');
      }
      toast.success('Verification email accepted for sending. Check your inbox and spam folder.');
    } catch (error) {
      toast.error(error.message || 'Could not resend the code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen font-['Poppins'] relative p-4">
      <div className="w-full max-w-md p-8 bg-white border border-gray-200 shadow-md rounded-2xl">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">Verify Your Email</h2>
          <p className="mt-2 text-gray-600">Check {maskedEmail} for your verification code, including the spam folder.</p>
        </div>
        <div>
          <div className="flex flex-col items-center mb-4">
            <div className="w-full mb-3">
              <label className="text-sm font-medium text-gray-700">
                Verification Code
              </label>
            </div>
            <div className="flex justify-between w-full">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  ref={inputRefs.current[index]}
                  type="text"
                  maxLength={1}
                  className="w-12 h-12 text-xl font-semibold text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={verificationCode[index] || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!/^[0-9]*$/.test(value)) return;
                    const newCode = [...verificationCode];
                    newCode[index] = value;
                    setVerificationCode(newCode);
                    // Auto-focus next input
                    if (value && index < 5) {
                      inputRefs.current[index + 1].current.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace') {
                      e.preventDefault();
                      if (verificationCode[index]) {
                        // Clear current
                        const newCode = [...verificationCode];
                        newCode[index] = '';
                        setVerificationCode(newCode);
                      } else if (index > 0) {
                        // Move to previous
                        inputRefs.current[index - 1].current.focus();
                      }
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/[^0-9]/g, '');
                    setVerificationCode(Array.from({ length: 6 }, (_, i) => pastedData[i] || ''));
                    // Focus last filled input
                    if (pastedData.length > 0) {
                      const last = Math.min(pastedData.length - 1, 5);
                      setTimeout(() => {
                        inputRefs.current[last].current.focus();
                      }, 0);
                    }
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-6 w-full">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-6 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-300"
              disabled={isLoading || !/^\d{6}$/.test(verificationCode.join(''))}
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Didn't receive a code?{' '}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleResendCode}
              className="font-medium text-blue-600 cursor-pointer hover:text-blue-800"
            >
              Resend code
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyClient;