import React, { useMemo, useState } from 'react';
import { formatCurrency } from '../utils/helpers';
import { VerifyPaymentResponse } from '../types';

type PaymentMethod = {
  id: 'bkash' | 'nagad' | 'rocket';
  label: string;
  accountNumber: string;
  brandImage: string;
  category: 'mfs' | 'global' | 'net_banking';
};

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'bkash',
    label: 'Bkash Personal',
    accountNumber: '01607656890',
    brandImage: 'https://pay.smmnea.com/assets/gateways/bkash/bkashpersonal.png',
    category: 'mfs',
  },
  {
    id: 'nagad',
    label: 'Nagad Personal',
    accountNumber: '01607656890',
    brandImage: 'https://pay.smmnea.com/assets/gateways/nagad/nagadpersonal.png',
    category: 'mfs',
  },
  {
    id: 'rocket',
    label: 'Rocket Personal',
    accountNumber: '01607656890',
    brandImage: 'https://pay.smmnea.com/assets/gateways/rocket/rocketpersonal.png',
    category: 'mfs',
  },
];

const PaymentGateway: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [activeTab, setActiveTab] = useState<'mfs' | 'global' | 'net_banking'>('mfs');
  const [trxId, setTrxId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<VerifyPaymentResponse['data'] | null>(null);
  const [copiedField, setCopiedField] = useState<'number' | 'amount' | null>(null);

  const parsedAmount = Number(amount || 0);
  const formattedAmount = useMemo(() => (parsedAmount > 0 ? formatCurrency(parsedAmount) : '—'), [parsedAmount]);

  const handleContinue = () => {
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('অনুগ্রহ করে সঠিক পরিমাণ লিখুন।');
      return;
    }
    if (!selectedMethod) {
      setError('অনুগ্রহ করে একটি পেমেন্ট মাধ্যম নির্বাচন করুন।');
      return;
    }

    setError(null);
    setCopiedField(null);
    setStep(2);
  };

  const handleCopy = async (field: 'number' | 'amount') => {
    if (!selectedMethod) return;
    const value = field === 'number' ? selectedMethod.accountNumber : String(parsedAmount);

    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 1600);
    } catch (copyError) {
      console.error('Failed to copy text:', copyError);
      setError('কপি করা যায়নি। আবার চেষ্টা করুন।');
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!trxId.trim()) {
      setError('Please enter the Transaction ID');
      return;
    }
    if (!selectedMethod || parsedAmount <= 0) {
      setError('Please select payment method and amount first.');
      setStep(1);
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const payload = {
        transactionId: trxId.trim().toUpperCase(),
        amount: parsedAmount,
        provider: selectedMethod.id,
      };

      const res = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error(
          'Backend server is not reachable. Please check your terminal for errors and ensure .env.local exists.',
        );
      }

      if (!contentType.includes('application/json')) {
        throw new Error('Invalid response from server. Please contact support.');
      }

      const data: VerifyPaymentResponse = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      setSuccessData(data.data);
    } catch (verifyError: any) {
      console.error(verifyError);
      setError(verifyError.message || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (successData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f8ff] p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg shadow-[#0057d0]/10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-800">Payment Verified!</h2>
          <p className="mb-6 text-sm text-slate-500">Your payment has been successfully processed.</p>

          <div className="mb-7 space-y-2 rounded-xl bg-[#f7fbff] p-4 text-left text-sm">
            <p className="flex justify-between gap-3">
              <span className="text-slate-500">Transaction ID</span>
              <span className="font-mono font-medium text-slate-800">{successData.transactionId}</span>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-slate-500">Method</span>
              <span className="font-semibold uppercase text-slate-800">{successData.provider}</span>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-slate-500">Amount Paid</span>
              <span className="font-semibold text-slate-800">{formatCurrency(successData.amount)}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full rounded-xl bg-[#0057D0] px-4 py-3 font-semibold text-white transition hover:bg-[#0667ef]"
          >
            Make Another Payment
          </button>
        </div>
      </div>
    );
  }

  const instructionSteps = selectedMethod
    ? [
        <>
          আপনার <span className="font-semibold text-[#0057D0]">{selectedMethod.label}</span> মোবাইল অ্যাপে যান।
        </>,
        <>
          <span className="font-semibold text-[#0057D0]">Send Money</span> -এ ক্লিক করুন।
        </>,
        <>
          প্রাপক নম্বর হিসেবে এই নম্বরটি লিখুনঃ{' '}
          <span className="font-semibold text-[#0057D0]">{selectedMethod.accountNumber}</span>
        </>,
        <>
          টাকার পরিমাণঃ <span className="font-semibold text-[#0057D0]">{parsedAmount} BDT</span>
        </>,
        <>
          নিশ্চিত করতে এখন আপনার <span className="font-semibold text-[#0057D0]">{selectedMethod.label}</span> পিন লিখুন।
        </>,
        <>
          এখন নিচের বক্সে আপনার <span className="font-semibold text-[#0057D0]">Transaction ID</span> দিন এবং নিচের{' '}
          <span className="font-semibold text-[#0057D0]">Verify</span> বাটনে ক্লিক করুন।
        </>,
      ]
    : [];

  const visibleMethods = PAYMENT_METHODS.filter((method) => method.category === activeTab);

  return (
    <div
      className="min-h-screen w-full bg-[linear-gradient(350deg,#f4f9ff,#edf4ffc9)] bg-cover px-4 py-8 font-['Poppins',sans-serif] sm:flex sm:items-center sm:justify-center sm:p-12"
      style={{
        backgroundImage:
          "linear-gradient(350deg,#f4f9ff,#edf4ffc9),url('https://pay.smmnea.com/themes/default/assets/images/body.png')",
      }}
    >
      {verifying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-[1px]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#0057D0]/20 border-t-[#0057D0]" />
        </div>
      )}

      <div className="relative mx-auto w-full max-w-md overflow-hidden p-8 sm:min-w-[650px] sm:rounded-lg sm:bg-white sm:shadow-lg sm:shadow-[#0057d0]/10">
        <div className="flex h-12 w-full items-center justify-between overflow-hidden rounded-lg bg-white p-5 shadow-md shadow-[#0057d0]/5 sm:bg-[#fbfcff] sm:shadow-none sm:ring-1 sm:ring-[#0057d0]/10">
          <div />
          <button
            type="button"
            onClick={() => {
              if (step === 2) setStep(1);
            }}
            className="grid h-7 w-7 place-content-center rounded-full border border-[#e1ecff] text-[#6D7F9A]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {step === 1 && (
          <>
            <div className="mb-6 mt-7 flex w-full flex-col items-center sm:mb-3 sm:flex-row">
              <div className="mb-4 sm:mr-8">
                <img
                  src="https://pay.smmnea.com/uploads/settings/01K8P7GDA7DWWSZTQTZ7BX604W.png"
                  alt="Payment Gateway"
                  className="w-24 rounded-full object-cover ring-1 transition-all duration-300 hover:scale-105 sm:w-[85px]"
                />
              </div>
              <div className="flex flex-col items-center sm:items-start">
                <h3 className="mb-4 text-xl font-semibold text-[#6D7F9A] sm:mb-3">Payment Gateway</h3>
                <div className="text-xs text-[#879ab6]">সহায়তা • প্রশ্নাবলী • বিস্তারিত</div>
              </div>
            </div>

            <div className="mb-3 flex w-full justify-between overflow-hidden rounded-md bg-[#0057d0] text-white">
              <button
                type="button"
                onClick={() => setActiveTab('mfs')}
                className={`h-full w-full rounded-md py-1.5 text-center text-[12px] leading-[23px] transition-all sm:text-[15px] ${
                  activeTab === 'mfs' ? 'bg-[#004cb7] text-white' : 'text-white/90'
                }`}
              >
                মোবাইল ব্যাংকিং
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('global')}
                className={`h-full w-full rounded-md py-1.5 text-center text-[12px] leading-[23px] transition-all sm:text-[15px] ${
                  activeTab === 'global' ? 'bg-[#004cb7] text-white' : 'text-white/90'
                }`}
              >
                ইন্টারন্যাশনাল
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('net_banking')}
                className={`h-full w-full rounded-md py-1.5 text-center text-[12px] leading-[23px] transition-all sm:text-[15px] ${
                  activeTab === 'net_banking' ? 'bg-[#004cb7] text-white' : 'text-white/90'
                }`}
              >
                নেট ব্যাংকিং
              </button>
            </div>

            <div className="mt-3 w-full overflow-auto p-0.5 pb-3 sm:pb-0">
              <div className="grid grid-cols-2 gap-3 pb-3 sm:grid-cols-3">
                {visibleMethods.length === 0 && (
                  <div className="col-span-full rounded-lg border border-dashed border-[#b6c8e5] bg-white p-5 text-center text-sm text-[#6D7F9A]">
                    এই ক্যাটাগরির জন্য বর্তমানে কোনো গেটওয়ে নেই।
                  </div>
                )}
                {visibleMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setSelectedMethod(method);
                      setActiveTab(method.category);
                    }}
                    className={`flex flex-col items-center overflow-hidden rounded-xl border bg-[#ffffff] transition-shadow hover:shadow-lg hover:shadow-blue-900/5 ${
                      selectedMethod?.id === method.id ? 'border-[#0057d0]' : 'border-[#E0E0E0]'
                    }`}
                  >
                    <div className="flex h-14 w-full items-center justify-center px-3 py-2">
                      <img className="h-10 w-full object-contain" src={method.brandImage} alt={method.label} />
                    </div>
                    <div className="w-full border-t px-3 py-2">
                      <p className="text-center text-xs font-light tracking-wide text-[#222222]">{method.label}</p>
                    </div>
                  </button>
                ))}
              </div>

              <label className="mb-2 mt-2 block text-sm font-semibold text-[#30405a]">Amount (BDT)</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mb-2 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g. 13000"
                required
              />

              {error && <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
            </div>

            <button
              type="button"
              onClick={handleContinue}
              className="fixed bottom-0 left-0 w-full rounded-t-2xl bg-[#cde1ff] py-[18px] text-center font-semibold text-[#0057D0] backdrop-blur-sm sm:static sm:rounded-[10px] sm:bg-[#0057D0] sm:px-4 sm:py-3.5 sm:text-white"
            >
              Pay {parsedAmount > 0 ? `${parsedAmount} BDT` : 'Amount'}
            </button>
          </>
        )}

        {step === 2 && selectedMethod && (
          <div className="w-full">
            <div className="mt-4 flex flex-col flex-wrap sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 flex h-20 w-full items-center justify-center sm:mb-0">
                <img src={selectedMethod.brandImage} alt="GatewayLogo" className="h-[80%]" />
              </div>
              <div className="flex items-center rounded-lg bg-white px-5 py-3 shadow shadow-[#0057d0]/5 sm:h-[85px] sm:w-[60%] sm:shadow-none sm:ring-1 sm:ring-[#0057d0]/10">
                <div className="mr-4 flex h-[55px] w-[55px] items-center justify-center rounded-full p-1.5 ring-1 ring-[#0057d0]/10">
                  <img
                    src="https://pay.smmnea.com/uploads/settings/01K8P7GDA7DWWSZTQTZ7BX604W.png"
                    alt="Payment Gateway"
                    className="w-[80%]"
                  />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-semibold text-[#6D7F9A]">{selectedMethod.label}</h3>
                </div>
              </div>
              <div className="mt-3 flex flex-col rounded-lg bg-white p-4 shadow shadow-[#0057d0]/5 sm:mt-0 sm:h-[85px] sm:w-[35%] sm:items-center sm:justify-center sm:shadow-none sm:ring-1 sm:ring-[#0057d0]/10">
                <h1 className="text-xl font-semibold text-[#6D7F9A]">{parsedAmount} BDT</h1>
              </div>
            </div>

            <form onSubmit={handleVerify} className="mt-3">
              <div className="overflow-auto rounded-lg bg-white p-5 sm:ring-1 sm:ring-[#0057d0]/10">
                <div className="mb-5">
                  <ul className="text-gray-900">
                    {instructionSteps.map((stepText, index) => (
                      <React.Fragment key={index}>
                        <li className="flex text-sm">
                          <div className="mr-2 mt-[7px] h-1.5 w-1.5 rounded-full bg-[#0057D0]" />
                          <p>
                            {stepText}
                            {index === 2 && (
                              <button
                                type="button"
                                onClick={() => handleCopy('number')}
                                className="mx-2 inline-flex items-center gap-1 rounded-md bg-[#0057D0] px-2 py-0.5 text-xs text-slate-100 hover:bg-[#0667ef]"
                              >
                                কপি করুন
                              </button>
                            )}
                            {index === 3 && (
                              <button
                                type="button"
                                onClick={() => handleCopy('amount')}
                                className="mx-2 inline-flex items-center gap-1 rounded-md bg-[#0057D0] px-2 py-0.5 text-xs text-slate-100 hover:bg-[#0667ef]"
                              >
                                কপি করুন
                              </button>
                            )}
                          </p>
                        </li>
                        {index !== instructionSteps.length - 1 && <hr className="my-3" />}
                      </React.Fragment>
                    ))}
                  </ul>

                  {(copiedField || error) && (
                    <p
                      className={`mt-4 rounded-md p-2 text-sm ${
                        error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {error || (copiedField === 'number' ? 'নম্বর কপি হয়েছে।' : 'পরিমাণ কপি হয়েছে।')}
                    </p>
                  )}
                </div>

                <h2 className="mb-2 block text-sm font-bold text-gray-800">Transaction ID</h2>
                <input
                  type="text"
                  className="mb-2 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm uppercase text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  name="transaction_id"
                  placeholder="ট্রানজেকশন আইডি লিখুন"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="mt-5">
                <button
                  type="submit"
                  disabled={verifying}
                  className="block w-full rounded-[10px] bg-[#0057D0] px-4 py-3.5 text-center font-semibold text-white transition-colors hover:bg-[#0667ef] disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {verifying ? 'VERIFYING...' : 'VERIFY'}
                </button>
              </div>
            </form>

            <p className="mt-4 text-center text-xs text-[#6D7F9A]">Secure checkout • {formattedAmount}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentGateway;
