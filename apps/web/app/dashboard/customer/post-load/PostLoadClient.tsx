'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ChevronRight, Truck, MapPin, IndianRupee, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function PostLoadPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const [formData, setFormData] = useState({
        pickupCity: '',
        dropCity: '',
        truckType: 'taurus_10',
        materialType: 'Cement',
        weight: '35',
        price: 32000
    });

    const steps = [
        { id: 1, title: "Route Details", icon: MapPin },
        { id: 2, title: "Truck & Cargo", icon: Truck },
        { id: 3, title: "Smart Pricing", icon: IndianRupee },
        { id: 4, title: "Review & Pay", icon: CheckCircle2 }
    ];

    const nextStep = () => {
        setSubmitError('');
        if (step === 1 && (!formData.pickupCity.trim() || !formData.dropCity.trim())) {
            setSubmitError('Please enter both pickup and destination locations.');
            return;
        }
        if (step === 2 && (!formData.weight || parseFloat(formData.weight) <= 0)) {
            setSubmitError('Please enter a valid weight in tons.');
            return;
        }
        setStep(step + 1);
    };
    const prevStep = () => { setSubmitError(''); setStep(step - 1); };

    const handleSubmit = async () => {
        setLoading(true);
        setSubmitError('');
        try {
            // Map truckType to standardized body type
            const bodyTypeMap: Record<string, string> = {
                'tata_ace': 'OPEN_HIGH_BED',
                'eicher_19': 'OPEN_HIGH_BED',
                'taurus_10': 'CEMENT_BULKER'
            };

            await api.post('/loads', {
                source: formData.pickupCity,
                destination: formData.dropCity,
                sourceCity: formData.pickupCity,
                destinationCity: formData.dropCity,
                weight: parseFloat(formData.weight) || 35,
                goodsType: formData.materialType || 'Cement',
                requiredBodyType: bodyTypeMap[formData.truckType] || 'CEMENT_BULKER',
                price: Number(formData.price) || 32000,
                vehicleType: 'Heavy Truck'
            });

            alert('Load posted to live marketplace successfully! Fleet owners are being notified.');
            router.push('/dashboard/customer');
        } catch (err: any) {
            setSubmitError(err.response?.data?.message || 'Failed to post load. Please verify details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Stepper Header */}
            <div className="relative flex justify-between items-center mb-8">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 transform -translate-y-1/2"></div>

                {steps.map((s) => (
                    <div key={s.id} className="flex flex-col items-center bg-background px-2">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${step >= s.id
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'bg-white border-slate-300 text-slate-400'
                                }`}
                        >
                            <s.icon className="w-5 h-5" />
                        </div>
                        <span className={`text-xs mt-2 font-medium ${step >= s.id ? 'text-blue-900' : 'text-slate-400'}`}>
                            {s.title}
                        </span>
                    </div>
                ))}
            </div>

            <Card className="border-t-4 border-t-blue-600 shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl">{steps[step - 1].title}</CardTitle>
                    <CardDescription>Step {step} of 4</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[300px]">
                    {submitError && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 mb-6 animate-in fade-in">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{submitError}</span>
                        </div>
                    )}

                    {/* STEP 1: ROUTE */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Pickup City</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Enter pickup location..."
                                            className="pl-9"
                                            value={formData.pickupCity}
                                            onChange={(e) => setFormData({ ...formData, pickupCity: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Drop City</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-green-500" />
                                        <Input
                                            placeholder="Enter destination..."
                                            className="pl-9"
                                            value={formData.dropCity}
                                            onChange={(e) => setFormData({ ...formData, dropCity: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="h-40 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
                                <p className="text-slate-500 text-sm">Map Preview will appear here</p>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: TRUCK & CARGO */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <Label>Vehicle Type</Label>
                                <Select
                                    onValueChange={(val) => setFormData({ ...formData, truckType: val })}
                                    defaultValue={formData.truckType}
                                >
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="Select Truck Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tata_ace">Tata Ace (Small)</SelectItem>
                                        <SelectItem value="eicher_19">Eicher 19ft (Medium)</SelectItem>
                                        <SelectItem value="taurus_10">10-Tyre Taurus (Large)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Material Type</Label>
                                    <Input
                                        placeholder="e.g. Steel Rods, Textiles"
                                        value={formData.materialType}
                                        onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Weight (Tons)</Label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 12"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PRICING */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col items-center text-center space-y-2">
                                <Badge className="bg-blue-600 hover:bg-blue-700">AI Recommended</Badge>
                                <p className="text-slate-600">Fair Market Price</p>
                                <h3 className="text-4xl font-bold text-blue-900">₹{formData.price.toLocaleString()}</h3>
                                <p className="text-xs text-blue-600 font-medium">+ GST as applicable</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Your Offer Price (₹)</Label>
                                <Input
                                    type="number"
                                    value={formData.price}
                                    className="text-lg font-semibold"
                                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                                />
                                {formData.price < 20000 && (
                                    <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded-md">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>Price is lower than market average. Acceptance may be delayed.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 4: REVIEW */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-slate-50 p-6 rounded-xl space-y-4 border">
                                <div className="flex justify-between items-center pb-4 border-b">
                                    <span className="text-slate-500">Route</span>
                                    <span className="font-semibold">{formData.pickupCity} ➔ {formData.dropCity}</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b">
                                    <span className="text-slate-500">Vehicle</span>
                                    <span className="font-semibold capitalize">{formData.truckType || 'Standard Truck'}</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b">
                                    <span className="text-slate-500">Cargo</span>
                                    <span className="font-semibold">{formData.weight} Tons of {formData.materialType}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-slate-900 font-bold">Total Advance</span>
                                    <span className="text-2xl font-bold text-blue-600">₹2,000</span>
                                </div>
                                <p className="text-xs text-right text-slate-400">Remaining ₹{formData.price - 2000} to be paid on delivery.</p>
                            </div>
                        </div>
                    )}

                </CardContent>
                <CardFooter className="flex justify-between bg-slate-50/50 p-6">
                    <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={step === 1}
                    >
                        Back
                    </Button>

                    {step < 4 ? (
                        <Button onClick={nextStep} className="bg-blue-900 hover:bg-blue-800">
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 min-w-[150px]"
                        >
                            {loading ? 'Processing...' : 'Pay & Book Load'}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
