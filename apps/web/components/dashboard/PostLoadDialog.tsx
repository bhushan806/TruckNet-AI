'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import api from '@/lib/api';

export function PostLoadDialog({ onLoadPosted }: { onLoadPosted: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        source: '',
        destination: '',
        weight: '',
        goodsType: '',
        price: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/loads', {
                ...formData,
                weight: parseFloat(formData.weight),
                price: parseFloat(formData.price)
            });
            setOpen(false);
            setFormData({ source: '', destination: '', weight: '', goodsType: '', price: '' });
            onLoadPosted();
        } catch (error) {
            console.error(error);
            alert('Failed to post load');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Post New Load
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Post a New Load</DialogTitle>
                    <DialogDescription>
                        Enter the details of the shipment you want to transport.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="source" className="text-right">
                                Source
                            </Label>
                            <Input
                                id="source"
                                placeholder="Mumbai"
                                className="col-span-3"
                                value={formData.source}
                                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="destination" className="text-right">
                                Destination
                            </Label>
                            <Input
                                id="destination"
                                placeholder="Delhi"
                                className="col-span-3"
                                value={formData.destination}
                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="goodsType" className="text-right">
                                Goods Type
                            </Label>
                            <Input
                                id="goodsType"
                                placeholder="Electronics, Furniture..."
                                className="col-span-3"
                                value={formData.goodsType}
                                onChange={(e) => setFormData({ ...formData, goodsType: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="weight" className="text-right">
                                Weight
                            </Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <Input
                                    id="weight"
                                    type="number"
                                    placeholder="2.5"
                                    step="0.1"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    required
                                />
                                <span className="text-sm text-muted-foreground">Tons</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                                Price
                            </Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <span className="text-sm font-bold">₹</span>
                                <Input
                                    id="price"
                                    type="number"
                                    placeholder="15000"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Posting...' : 'Post Load'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
