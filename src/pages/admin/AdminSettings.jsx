import React, { useState, useEffect } from 'react';
import { settingsApi } from '../../api/settingsApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Sliders, Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  const [settings, setSettings] = useState({
    fineRatePerOverdueDay: 1,
    defaultMaxBorrowLimit: 3,
    standardLoanDurationDays: 14,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getSettings();
      const data = res?.data?.data || res?.data;
      if (data) {
        setSettings({
          fineRatePerOverdueDay: data.fineRatePerOverdueDay ?? data.finePerDay ?? 1,
          defaultMaxBorrowLimit: data.defaultMaxBorrowLimit ?? data.maxBooksPerStudent ?? 3,
          standardLoanDurationDays: data.standardLoanDurationDays ?? data.defaultLoanDays ?? 14,
        });
      }
    } catch (err) {
      console.error('Failed to load settings', err);
      setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Failed to load system settings from server.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertMsg(null);

    const fineRate = Number(settings.fineRatePerOverdueDay);
    const borrowLimit = Number(settings.defaultMaxBorrowLimit);
    const loanDuration = Number(settings.standardLoanDurationDays);

    if (isNaN(fineRate) || fineRate < 0) {
      setAlertMsg({ type: 'error', text: 'Fine Rate per Overdue Day must be a valid non-negative number (≥ 0).' });
      return;
    }

    if (isNaN(borrowLimit) || !Number.isInteger(borrowLimit) || borrowLimit < 1) {
      setAlertMsg({ type: 'error', text: 'Default Max Borrow Limit must be a valid positive integer (≥ 1).' });
      return;
    }

    if (isNaN(loanDuration) || !Number.isInteger(loanDuration) || loanDuration < 1) {
      setAlertMsg({ type: 'error', text: 'Standard Loan Duration must be a valid positive integer (≥ 1).' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fineRatePerOverdueDay: fineRate,
        defaultMaxBorrowLimit: borrowLimit,
        standardLoanDurationDays: loanDuration,
      };

      const res = await settingsApi.updateSettings(payload);
      const data = res?.data?.data || res?.data;
      if (data) {
        setSettings({
          fineRatePerOverdueDay: data.fineRatePerOverdueDay ?? data.finePerDay ?? fineRate,
          defaultMaxBorrowLimit: data.defaultMaxBorrowLimit ?? data.maxBooksPerStudent ?? borrowLimit,
          standardLoanDurationDays: data.standardLoanDurationDays ?? data.defaultLoanDays ?? loanDuration,
        });
      }
      setAlertMsg({ type: 'success', text: 'System settings updated successfully.' });
    } catch (err) {
      console.error('Failed to update settings', err);
      setAlertMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to update system settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings & Rules</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Configure global library policies, borrowing rules, and overdue fine rates.</p>
      </div>

      {alertMsg && (
        <Alert variant={alertMsg.type === 'error' ? 'danger' : 'success'}>
          {alertMsg.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span>{alertMsg.text}</span>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#8D6B94] dark:text-[#B185A7]" />
              Global Policy Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Fine Rate per Overdue Day (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={settings.fineRatePerOverdueDay}
                  onChange={(e) => setSettings({ ...settings, fineRatePerOverdueDay: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="mt-1 font-mono font-bold"
                  disabled={loading || saving}
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Daily fine charged automatically when a book exceeds due date (Standard: ₹1/day).</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Default Max Borrow Limit per Student</label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={settings.defaultMaxBorrowLimit}
                  onChange={(e) => setSettings({ ...settings, defaultMaxBorrowLimit: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="mt-1 font-mono font-bold"
                  disabled={loading || saving}
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Maximum active borrowed books allowed simultaneously per student.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Standard Loan Duration (Days)</label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  required
                  value={settings.standardLoanDurationDays}
                  onChange={(e) => setSettings({ ...settings, standardLoanDurationDays: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="mt-1 font-mono font-bold"
                  disabled={loading || saving}
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Default loan period allocated upon issuing a book copy (Standard: 14 Days).</p>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <Button type="submit" loading={saving} disabled={loading || saving} className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save System Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
