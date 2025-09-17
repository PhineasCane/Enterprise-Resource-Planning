import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '../ui/button';
import FormInput from '../FormControls/FormInput';
import { fetchPaymentDetails, createPaymentDetail, updatePaymentDetail, deletePaymentDetail } from '../../store/slices/paymentDetailsSlice';

export default function PaymentDetailsForm() {
  const dispatch = useDispatch();
  const { list } = useSelector((s) => s.paymentDetails);
  const [form, setForm] = useState({ name: '', bank: '', accountNumber: '', branch: '', bankCode: '', branchCode: '', swiftCode: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { dispatch(fetchPaymentDetails()); }, [dispatch]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await dispatch(updatePaymentDetail({ id: editingId, changes: form }));
    } else {
      await dispatch(createPaymentDetail(form));
    }
    setForm({ name: '', bank: '', accountNumber: '', branch: '', bankCode: '', branchCode: '', swiftCode: '' });
    setEditingId(null);
  };

  const onEdit = (row) => { setEditingId(row.id); setForm({ name: row.name||'', bank: row.bank||'', accountNumber: row.accountNumber||'', branch: row.branch||'', bankCode: row.bankCode||'', branchCode: row.branchCode||'', swiftCode: row.swiftCode||'' }); };
  const onDelete = async (id) => { await dispatch(deletePaymentDetail(id)); };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput label="Name" value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })} required />
        <FormInput label="Bank" value={form.bank} onChange={(e)=>setForm({ ...form, bank: e.target.value })} required />
        <FormInput label="Account Number" value={form.accountNumber} onChange={(e)=>setForm({ ...form, accountNumber: e.target.value })} required />
        <FormInput label="Branch" value={form.branch} onChange={(e)=>setForm({ ...form, branch: e.target.value })} />
        <FormInput label="Bank Code" value={form.bankCode} onChange={(e)=>setForm({ ...form, bankCode: e.target.value })} />
        <FormInput label="Branch Code" value={form.branchCode} onChange={(e)=>setForm({ ...form, branchCode: e.target.value })} />
        <FormInput label="Swift Code" value={form.swiftCode} onChange={(e)=>setForm({ ...form, swiftCode: e.target.value })} />
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{editingId ? 'Update' : 'Add'} Payment Detail</Button>
        </div>
      </form>

      <div className="space-y-2">
        {list.map((row)=> (
          <div key={row.id} className="flex items-center justify-between border rounded-md p-3">
            <div>
              <div className="font-medium">{row.name} • {row.bank}</div>
              <div className="text-sm text-gray-600">Acct: {row.accountNumber}{row.branch ? ` • ${row.branch}` : ''}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={()=>onEdit(row)}>Edit</Button>
              <Button variant="destructive" onClick={()=>onDelete(row.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


