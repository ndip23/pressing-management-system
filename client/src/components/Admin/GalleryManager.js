import React, { useState, useEffect, useRef } from 'react';
import { uploadGalleryImageApi, getBusinessGalleryApi, deleteGalleryImageApi } from '../../services/api';
import { Trash2, UploadCloud, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const GalleryManager = ({ tenantId }) => {
    const [gallery, setGallery] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const loadGallery = async () => {
        try {
            const { data } = await getBusinessGalleryApi(tenantId);
            setGallery(data || []);
        } catch (err) {
            toast.error("Failed to load gallery");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) loadGallery();
    }, [tenantId]);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file); // Ensure this matches your route .single() name
        console.log("Sending file:", file.name);
        try {
            await uploadGalleryImageApi(formData);
            toast.success("Image uploaded!");
            loadGallery();
        } catch (err) {
            toast.error("Upload failed");
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this image?")) return;
        try {
            await deleteGalleryImageApi(id);
            toast.success("Image deleted");
            loadGallery();
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    if (loading) return <div className="p-4"><Spinner /></div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gallery.map(img => (
                    <div key={img._id} className="relative group rounded-lg overflow-hidden shadow-md">
                        <img src={img.imageUrl} className="w-full h-32 object-cover" alt="Gallery" />
                        <button 
                            onClick={() => handleDelete(img._id)} 
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                
                {/* Upload Button Placeholder */}
                <div 
                    onClick={() => fileInputRef.current.click()}
                    className="border-2 border-dashed border-apple-gray-300 dark:border-apple-gray-700 rounded-lg flex flex-col items-center justify-center h-32 cursor-pointer hover:bg-apple-gray-100 transition"
                >
                    {uploading ? <Spinner size="sm" /> : (
                        <>
                            <Plus size={24} className="text-apple-gray-400" />
                            <span className="text-xs text-apple-gray-500 mt-2">Add Photo</span>
                        </>
                    )}
                </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} accept="image/*" />
        </div>
    );
};

export default GalleryManager;