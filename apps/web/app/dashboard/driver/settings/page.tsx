'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Lock, Bell, Moon, Globe, Save, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { notify } from '@/lib/toast';
import { useAuth } from '@/lib/auth-context';

export default function DriverSettingsPage() {
    const { user } = useAuth();
    const [savingPassword, setSavingPassword] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [prefs, setPrefs] = useState({
        emailNotifications: true,
        smsNotifications: false,
        loadAlerts: true,
        darkMode: false,
        language: 'English',
    });

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            notify.error('New passwords do not match');
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            notify.error('Password must be at least 8 characters');
            return;
        }
        setSavingPassword(true);
        try {
            await api.patch('/auth/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            notify.success('Password updated successfully!');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            notify.error(err.response?.data?.message || 'Failed to update password');
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/driver">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Settings</h1>
                    <p className="text-muted-foreground text-sm">Manage your account preferences and security</p>
                </div>
            </div>

            {/* Account Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" /> Account
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                        <div>
                            <p className="text-sm font-medium">Name</p>
                            <p className="text-xs text-muted-foreground">{user?.name}</p>
                        </div>
                        <Link href="/dashboard/driver/profile">
                            <Button variant="link" size="sm" className="text-xs">Edit Profile →</Button>
                        </Link>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                        <div>
                            <p className="text-sm font-medium">Email</p>
                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <div>
                            <p className="text-sm font-medium">Role</p>
                            <p className="text-xs text-muted-foreground">{user?.role}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" /> Change Password
                    </CardTitle>
                    <CardDescription>Keep your account secure with a strong password</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Current Password</Label>
                            <div className="relative">
                                <Input
                                    type={showCurrent ? 'text' : 'password'}
                                    placeholder="Enter current password"
                                    value={passwordForm.currentPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                >
                                    {showCurrent ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showNew ? 'text' : 'password'}
                                    placeholder="Minimum 8 characters"
                                    value={passwordForm.newPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    required
                                    minLength={8}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                                    onClick={() => setShowNew(!showNew)}
                                >
                                    {showNew ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Re-enter new password"
                                    value={passwordForm.confirmPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                >
                                    {showConfirm ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                            </div>
                        </div>
                        <Button type="submit" disabled={savingPassword} className="w-full">
                            <Save className="h-4 w-4 mr-2" />
                            {savingPassword ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" /> Notification Preferences
                    </CardTitle>
                    <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Get updates via email' },
                        { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive SMS for important alerts' },
                        { key: 'loadAlerts', label: 'New Load Alerts', desc: 'Notify when matching loads are available' },
                    ].map(item => (
                        <div key={item.key} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                            <Switch
                                checked={prefs[item.key as keyof typeof prefs] as boolean}
                                onCheckedChange={val => setPrefs({ ...prefs, [item.key]: val })}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Moon className="h-4 w-4 text-muted-foreground" /> Appearance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Dark Mode</p>
                            <p className="text-xs text-muted-foreground">Switch to dark theme (coming soon)</p>
                        </div>
                        <Switch
                            checked={prefs.darkMode}
                            onCheckedChange={val => setPrefs({ ...prefs, darkMode: val })}
                            disabled
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
