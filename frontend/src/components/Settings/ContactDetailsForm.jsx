import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import FormInput from '../FormControls/FormInput';
import { fetchContactDetails, createContactDetail, updateContactDetail, deleteContactDetail } from '../../store/slices/contactDetailsSlice';

export default function ContactDetailsForm() {
  const dispatch = useDispatch();
  const { list, status } = useSelector((s) => s.contactDetails);
  const [form, setForm] = useState({ name: '', email: '', telephone: '', department: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { dispatch(fetchContactDetails()); }, [dispatch]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await dispatch(updateContactDetail({ id: editingId, changes: form }));
    } else {
      await dispatch(createContactDetail(form));
    }
    setForm({ name: '', email: '', telephone: '', department: '' });
    setEditingId(null);
  };

  const onEdit = (row) => {
    setEditingId(row.id);
    setForm({ name: row.name || '', email: row.email || '', telephone: row.telephone || '', department: row.department || '' });
  };

  const onDelete = async (id) => { await dispatch(deleteContactDetail(id)); };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput label="Contact Name" value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })} required />
        <FormInput label="Email" type="email" value={form.email} onChange={(e)=>setForm({ ...form, email: e.target.value })} required />
        <FormInput label="Telephone" value={form.telephone} onChange={(e)=>setForm({ ...form, telephone: e.target.value })} />
        <FormInput label="Department" value={form.department} onChange={(e)=>setForm({ ...form, department: e.target.value })} />
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            {editingId ? 'Update Contact' : 'Add Contact'}
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        {list.map((row) => (
          <div key={row.id} className="flex items-center justify-between border rounded-md p-3">
            <div>
              <div className="font-medium">{row.name} {row.department && <span className="text-gray-500">- {row.department}</span>}</div>
              <div className="text-sm text-gray-600">{row.email}{row.telephone ? ` • ${row.telephone}` : ''}</div>
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


