import { PackageName, AppName } from '../types';

export const getAppName = (packageName: string): AppName => {
  switch (packageName) {
    case PackageName.BKASH:
      return 'bKash';
    case PackageName.NAGAD:
      return 'Nagad';
    case PackageName.ROCKET:
      return 'Rocket';
    default:
      return 'Unknown';
  }
};

export const getAppColor = (appName: AppName): string => {
  switch (appName) {
    case 'bKash':
      return 'text-pink-600 bg-pink-100 dark:bg-pink-900/30 dark:text-pink-400';
    case 'Nagad':
      return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
    case 'Rocket':
      return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400';
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
