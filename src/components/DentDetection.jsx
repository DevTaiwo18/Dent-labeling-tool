import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Upload, X, Download, Edit2, Save, Info, Trash2, Edit3, Calendar, ArrowRight, FolderOpen, CheckCircle, AlertCircle, Loader, ArrowLeft, RefreshCw, Car, Plus, LayoutGrid } from 'lucide-react';

const API_ENDPOINT = 'https://dent-detection-app.wittyglacier-9b6d796b.eastus.azurecontainerapps.io/detect/format';
const API_TOKEN = 'f9f0b1bc-82b1-sexy-8a4a-505359ddd8b5';
const CLOUDINARY_CLOUD_NAME = 'dtpgsm5vf';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

const DENT_CATEGORIES = {
    nickel: { color: '#a855f7', label: 'Nickel' },
    quarter: { color: '#3b82f6', label: 'Quarter' },
    half_dollar: { color: '#22c55e', label: 'Half Dollar' },
    oversized: { color: '#f59e0b', label: 'Oversize' }
};

const VEHICLE_PANELS = [
    'Hood', 'Roof', 'L Rail', 'R Rail', 'Lid/Gate',
    'L Qtr/Side', 'L Cab Side', 'LR Door', 'LF Door',
    'L Fender', 'R Fender', 'RF Door', 'RR Door',
    'R Cab Side', 'R Qtr/Side', 'Cowl', 'W/S Frame'
];

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const SCALE_STEP = 0.2;

const loadPdfMake = () => {
    return new Promise((resolve, reject) => {
        if (window.pdfMake) {
            resolve(window.pdfMake);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js';
        script.onload = () => {
            const fontsScript = document.createElement('script');
            fontsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.min.js';
            fontsScript.onload = () => resolve(window.pdfMake);
            fontsScript.onerror = () => reject(new Error('Failed to load fonts'));
            document.head.appendChild(fontsScript);
        };
        script.onerror = () => reject(new Error('Failed to load pdfMake'));
        document.head.appendChild(script);
    });
};

const PanelSelectionModal = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Select Vehicle Panel</h2>
                        <p className="text-sm text-gray-600 mt-1">Choose the panel for these images</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {VEHICLE_PANELS.map(panel => (
                        <button
                            key={panel}
                            onClick={() => onSelect(panel)}
                            className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
                        >
                            <div className="flex items-center gap-2">
                                <Car className="w-5 h-5 text-orange-500" />
                                <span className="font-medium text-gray-800">{panel}</span>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                    <button onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

const PanelImagesGridView = ({ isOpen, onClose, panel, images, onSelectImage }) => {
    if (!isOpen) return null;
    const totalDents = images.reduce((sum, img) => sum + Object.keys(img.dents).length, 0);
    return (
        <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <button onClick={onClose} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-3">
                                    <ArrowLeft className="w-5 h-5" />
                                    <span className="font-medium">Back to Panel Results</span>
                                </button>
                                <h1 className="text-3xl font-bold text-gray-800">{panel}</h1>
                                <p className="text-gray-600 mt-1">{images.length} images • {totalDents} total dents</p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-lg"><LayoutGrid className="w-8 h-8 text-orange-600" /></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {images.map((image, index) => {
                            const dentCount = Object.keys(image.dents).length;
                            const dentsByCategory = Object.values(image.dents).reduce((acc, dent) => {
                                acc[dent.category] = (acc[dent.category] || 0) + 1;
                                return acc;
                            }, {});
                            return (
                                <div key={index} onClick={() => onSelectImage(index)} className="bg-white rounded-lg border-2 border-gray-200 hover:border-orange-500 cursor-pointer transition-all overflow-hidden group shadow-sm hover:shadow-lg">
                                    <div className="aspect-video relative bg-gray-100 overflow-hidden">
                                        <img src={image.imageUrl} alt={image.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">{dentCount} dents</div>
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-white rounded-full p-3 shadow-lg"><Edit2 className="w-6 h-6 text-orange-600" /></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <p className="font-medium text-gray-800 truncate mb-2" title={image.fileName}>{image.fileName}</p>
                                        {Object.keys(dentsByCategory).length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(dentsByCategory).map(([category, count]) => (
                                                    <div key={category} className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-full text-xs border border-gray-200">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DENT_CATEGORIES[category]?.color }} />
                                                        <span className="font-medium">{DENT_CATEGORIES[category]?.label}: {count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const InstructionModal = ({ isOpen, onClose, onDontShowAgain, onStartAnnotating }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">How to Annotate Dents</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                        <div className="flex gap-3">
                            <Info className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-orange-800 mb-1">Quick Start Guide</h3>
                                <p className="text-orange-700 text-sm">Follow these simple steps to mark dents on your image professionally.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                            <div>
                                <h4 className="font-semibold text-blue-800 mb-1">Select Dent Category</h4>
                                <p className="text-blue-700 text-sm">Choose the appropriate dent size from the left panel.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                            <div>
                                <h4 className="font-semibold text-green-800 mb-1">Draw Dent Areas</h4>
                                <p className="text-green-700 text-sm">Click and drag on the image to outline each dent. Switch categories anytime.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                            <div>
                                <h4 className="font-semibold text-purple-800 mb-1">Edit & Export</h4>
                                <p className="text-purple-700 text-sm">Review, edit or delete dents, then export your complete analysis.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-200">
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                onChange={(e) => { if (e.target.checked) onDontShowAgain(); }}
                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                            Don't show this again
                        </label>
                        <div className="flex gap-2">
                            <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors duration-200">
                                Cancel
                            </button>
                            <button onClick={onStartAnnotating} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium">
                                Start Annotating
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BatchProcessingModal = ({ isOpen, processedCount, totalCount, currentFile, failedFiles }) => {
    if (!isOpen) return null;
    const progress = totalCount > 0 ? (processedCount / totalCount) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                        <Loader className="w-8 h-8 text-orange-500 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Images</h2>
                    <p className="text-gray-600">{processedCount} of {totalCount} images processed</p>
                </div>
                <div className="space-y-4">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div className="bg-orange-500 h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                    </div>
                    {currentFile && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800 font-medium">Currently processing:</p>
                            <p className="text-sm text-blue-600 truncate mt-1">{currentFile}</p>
                        </div>
                    )}
                    {failedFiles.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {failedFiles.length} image(s) failed to process
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ExportModal = ({ isOpen, onClose, onExport, isBatch, imageCount, panelData }) => {
    if (!isOpen) return null;

    const [filename, setFilename] = useState('dent-analysis');
    const [format, setFormat] = useState('pdf');

    const handleExport = () => {
        onExport(filename, format);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isBatch ? 'Export Batch Analysis' : 'Export Analysis'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    {isBatch && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800 mb-2">
                                <strong>{imageCount}</strong> images across <strong>{Object.keys(panelData || {}).length}</strong> panels
                            </p>
                            {panelData && (
                                <div className="text-xs text-blue-700 mt-2 space-y-1">
                                    {Object.entries(panelData).map(([panel, data]) => (
                                        <div key={panel}>• {panel}: {data.totalDents} dents</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filename</label>
                        <input
                            type="text"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Enter filename"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
                        <div className="space-y-3">
                            <div 
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${format === 'pdf' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                                onClick={() => setFormat('pdf')}
                            >
                                <div className="flex items-center gap-3">
                                    <input type="radio" checked={format === 'pdf'} onChange={() => setFormat('pdf')} className="w-5 h-5" />
                                    <div>
                                        <div className="font-semibold text-gray-800">PDF Report</div>
                                        <div className="text-sm text-gray-600">Professional report with panel breakdown</div>
                                    </div>
                                </div>
                            </div>

                            <div 
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${format === 'zip' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                                onClick={() => setFormat('zip')}
                            >
                                <div className="flex items-center gap-3">
                                    <input type="radio" checked={format === 'zip'} onChange={() => setFormat('zip')} className="w-5 h-5" />
                                    <div>
                                        <div className="font-semibold text-gray-800">ZIP Archive</div>
                                        <div className="text-sm text-gray-600">JSON data with panel categorization</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-200">
                        <div className="flex space-x-3">
                            <button onClick={onClose} className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium">
                                Cancel
                            </button>
                            <button onClick={handleExport} className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 transition-colors duration-200 font-medium shadow-lg">
                                <Download className="w-4 h-4" />
                                Export {format.toUpperCase()}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DrawingCanvas = ({ imageRef, scale, position, onAddDent, currentCategory, onFinishDrawing }) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
    const [currentRect, setCurrentRect] = useState(null);
    const canvasRef = useRef(null);

    const getCanvasCoordinates = (e) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - position.x) / scale,
            y: (e.clientY - rect.top - position.y) / scale
        };
    };

    const handleMouseDown = (e) => {
        if (!currentCategory) return;
        e.stopPropagation();
        setIsDrawing(true);
        const point = getCanvasCoordinates(e);
        setStartPoint(point);
        setCurrentRect({ x: point.x, y: point.y, width: 0, height: 0 });
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || !currentRect) return;
        const currentPoint = getCanvasCoordinates(e);
        setCurrentRect({
            x: Math.min(startPoint.x, currentPoint.x),
            y: Math.min(startPoint.y, currentPoint.y),
            width: Math.abs(currentPoint.x - startPoint.x),
            height: Math.abs(currentPoint.y - startPoint.y)
        });
    };

    const handleMouseUp = () => {
        if (!isDrawing || !currentRect || !currentCategory) return;
        if (currentRect.width > 5 && currentRect.height > 5) {
            const newDent = {
                center: {
                    x: currentRect.x + currentRect.width / 2,
                    y: currentRect.y + currentRect.height / 2
                },
                x_size: currentRect.width,
                y_size: currentRect.height,
                category: currentCategory
            };
            onAddDent(newDent);
            onFinishDrawing();
        }
        setIsDrawing(false);
        setCurrentRect(null);
    };

    const handleMouseLeave = () => {
        if (isDrawing) {
            setIsDrawing(false);
            setCurrentRect(null);
        }
    };

    return (
        <div
            ref={canvasRef}
            className="absolute inset-0 z-10"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        >
            {currentRect && isDrawing && (
                <div
                    className="absolute border-2 bg-opacity-30"
                    style={{
                        left: `${(currentRect.x * scale) + position.x}px`,
                        top: `${(currentRect.y * scale) + position.y}px`,
                        width: `${currentRect.width * scale}px`,
                        height: `${currentRect.height * scale}px`,
                        borderColor: DENT_CATEGORIES[currentCategory]?.color || '#fff',
                        backgroundColor: `${DENT_CATEGORIES[currentCategory]?.color}33`
                    }}
                />
            )}
        </div>
    );
};

const DentOverlay = ({ dentId, dent, category, imageSize, isSelected, onSelect, scale }) => {
    const EXPANSION_FACTOR = 1.2;

    const getBoundedPosition = (center, size, maxSize) => {
        const expandedSize = size * EXPANSION_FACTOR;
        let position = center - (expandedSize / 2);
        position = Math.max(0, Math.min(position, maxSize - expandedSize));
        return position;
    };

    const expandedXSize = dent.x_size * EXPANSION_FACTOR;
    const expandedYSize = dent.y_size * EXPANSION_FACTOR;
    const left = getBoundedPosition(dent.center.x, dent.x_size, imageSize.width);
    const top = getBoundedPosition(dent.center.y, dent.y_size, imageSize.height);

    return (
        <div
            className="absolute group cursor-pointer"
            style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${expandedXSize}px`,
                height: `${expandedYSize}px`,
                border: `${3 / scale}px solid ${category.color}`,
                backgroundColor: `${category.color}22`,
                transition: 'background-color 0.2s ease-in-out',
                boxShadow: isSelected ? `0 0 0 ${2 / scale}px white, 0 0 0 ${4 / scale}px ${category.color}` : 'none'
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect?.();
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${category.color}44`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${category.color}22`;
            }}
        >
            <div
                className="absolute rounded-full border-2 border-white"
                style={{
                    left: `${expandedXSize / 2 - (4 / scale)}px`,
                    top: `${expandedYSize / 2 - (4 / scale)}px`,
                    width: `${8 / scale}px`,
                    height: `${8 / scale}px`,
                    backgroundColor: category.color,
                    boxShadow: `0 0 ${3 / scale}px rgba(0,0,0,0.5)`
                }}
            />

            <div
                className={`absolute -top-6 left-0 px-2 py-1 rounded text-xs whitespace-nowrap transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-90'}`}
                style={{
                    backgroundColor: category.color,
                    color: 'white',
                    transform: `scale(${1 / scale})`,
                    transformOrigin: 'bottom left'
                }}
            >
                {Math.round(dent.center.x)}, {Math.round(dent.center.y)}
            </div>
        </div>
    );
};

const PanelResultsView = ({ panelData, onSelectPanel, onExportAll, onClearAll }) => {
    const totalDents = Object.values(panelData).reduce((sum, data) => sum + data.totalDents, 0);
    const totalImages = Object.values(panelData).reduce((sum, data) => sum + data.images.length, 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Panel Analysis Results</h2>
                    <p className="text-gray-600 mt-1">{Object.keys(panelData).length} panels • {totalImages} images • {totalDents} total dents</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onExportAll} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all">
                        <Download className="w-4 h-4" />Export All
                    </button>
                    <button onClick={onClearAll} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
                        <Trash2 className="w-4 h-4" />Clear
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(panelData).map(([panel, data]) => {
                    const avgSize = data.averageDentSize;
                    
                    return (
                        <div key={panel} className="bg-white rounded-lg border-2 border-gray-200 p-5 hover:border-orange-500 cursor-pointer transition-all shadow-sm hover:shadow-lg" onClick={() => onSelectPanel(panel)}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-orange-100 p-2 rounded-lg">
                                        <Car className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{panel}</h3>
                                        <p className="text-sm text-gray-500">{data.images.length} image{data.images.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-orange-600">{data.totalDents}</div>
                                    <div className="text-xs text-gray-500">dents</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500 mb-1">Avg Dent Size</div>
                                    <div className="font-semibold text-gray-800">{avgSize.toFixed(1)}px</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500 mb-1">Category</div>
                                    <div className="font-semibold text-gray-800">{data.topCategory || 'N/A'}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-xs font-medium text-gray-600 mb-2">Dent Breakdown:</div>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(data.dentsByCategory).map(([category, count]) => (
                                        <div key={category} className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-full text-xs border border-gray-200">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DENT_CATEGORIES[category]?.color }} />
                                            <span className="font-medium">{DENT_CATEGORIES[category]?.label}: {count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function DentDetection() {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [selectedImage, setSelectedImage] = useState(null);
    const [aiDents, setAiDents] = useState({});
    const [manualDents, setManualDents] = useState({});
    const [modifiedAiDents, setModifiedAiDents] = useState({});
    const [deletedDents, setDeletedDents] = useState(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [selectedDent, setSelectedDent] = useState(null);
    const [filterCategory, setFilterCategory] = useState(null);

    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [nextDentId, setNextDentId] = useState(1);

    const [showInstructionModal, setShowInstructionModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showPanelModal, setShowPanelModal] = useState(false);
    const [showGridView, setShowGridView] = useState(false);
    const [selectedPanelForGrid, setSelectedPanelForGrid] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [hideInstructions, setHideInstructions] = useState(false);

    const [panelMode, setPanelMode] = useState(false);
    const [panelData, setPanelData] = useState({});
    const [currentPanel, setCurrentPanel] = useState(null);
    const [pendingFiles, setPendingFiles] = useState([]);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ processed: 0, total: 0, currentFile: '' });
    const [batchFailedFiles, setBatchFailedFiles] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const [showPanelResults, setShowPanelResults] = useState(false);

    const containerRef = useRef(null);
    const imageRef = useRef(null);
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);

    const uploadToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error('Cloudinary upload failed');
            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error('Cloudinary error:', error);
            return URL.createObjectURL(file);
        }
    };

    const processSingleImage = async (file) => {
        const imageUrl = await uploadToCloudinary(file);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch(`${API_ENDPOINT}?threshold=0.05`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${API_TOKEN}` },
                body: formData
            });
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const data = await response.json();
            return {
                fileName: file.name,
                imageUrl,
                dents: data.dent_locations || {},
                success: true
            };
        } catch (error) {
            console.error(`Error: ${file.name}`, error);
            return { fileName: file.name, imageUrl, dents: {}, success: false };
        }
    };

    const handlePanelSelect = async (panel) => {
        setShowPanelModal(false);
        setCurrentPanel(panel);
        setPanelMode(true);
        setShowPanelResults(false);
        setIsBatchProcessing(true);
        setBatchFailedFiles([]);

        const results = [];
        const failed = [];

        for (let i = 0; i < pendingFiles.length; i++) {
            setBatchProgress({ processed: i, total: pendingFiles.length, currentFile: pendingFiles[i].name });
            const result = await processSingleImage(pendingFiles[i]);
            if (result.success) results.push(result);
            else failed.push(pendingFiles[i].name);
            await new Promise(r => setTimeout(r, 100));
        }

        setBatchProgress({ processed: pendingFiles.length, total: pendingFiles.length, currentFile: '' });
        setBatchFailedFiles(failed);
        setIsBatchProcessing(false);

        const allDents = results.flatMap(r => Object.values(r.dents));
        const totalDents = allDents.length;
        const avgSize = totalDents > 0 
            ? allDents.reduce((sum, dent) => sum + Math.sqrt(dent.x_size * dent.y_size), 0) / totalDents 
            : 0;

        const dentsByCategory = allDents.reduce((acc, dent) => {
            acc[dent.category] = (acc[dent.category] || 0) + 1;
            return acc;
        }, {});

        const topCategory = Object.entries(dentsByCategory).sort((a, b) => b[1] - a[1])[0]?.[0];

        setPanelData(prev => ({
            ...prev,
            [panel]: {
                images: results,
                totalDents,
                averageDentSize: avgSize,
                dentsByCategory,
                topCategory: DENT_CATEGORIES[topCategory]?.label
            }
        }));

        setPendingFiles([]);
        setShowPanelResults(true);
    };

    const handleFolderUpload = async (event) => {
        const files = Array.from(event.target.files).filter(f => f.type.startsWith('image/'));
        if (files.length === 0) {
            setError('No image files found in folder');
            return;
        }

        const filesToProcess = files.slice(0, 100);
        if (files.length > 100) {
            console.log(`Selected ${files.length} images, processing first 100`);
        }

        setPendingFiles(filesToProcess);
        setShowPanelModal(true);
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setIsLoading(true);
            setError(null);
            setPanelMode(false);
            setShowPanelResults(false);
            setManualDents({});
            setModifiedAiDents({});
            setDeletedDents(new Set());
            setSelectedDent(null);
            setIsDrawingMode(false);
            setIsEditMode(false);

            const imageUrl = await uploadToCloudinary(file);
            setSelectedImage(imageUrl);

            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch(`${API_ENDPOINT}?threshold=0.05`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${API_TOKEN}` },
                body: formData
            });
            if (!response.ok) throw new Error('API error');
            const data = await response.json();
            setAiDents(data.dent_locations || {});
        } catch (error) {
            setError('Failed to process image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getAllActiveDents = () => {
        const active = {};
        Object.entries(aiDents).forEach(([id, dent]) => {
            if (!deletedDents.has(id) && !modifiedAiDents[id]) {
                active[id] = dent;
            }
        });
        Object.entries(modifiedAiDents).forEach(([id, dent]) => {
            if (!deletedDents.has(id)) {
                active[id] = dent;
            }
        });
        Object.entries(manualDents).forEach(([id, dent]) => {
            active[id] = dent;
        });
        return active;
    };

    const handlePanelClick = (panel) => {
        setSelectedPanelForGrid(panel);
        setShowGridView(true);
        setShowPanelResults(false);
    };

    const handleBackToGrid = () => {
        setSelectedImageIndex(null);
        setSelectedImage(null);
        setShowGridView(true);
        setIsDrawingMode(false);
        setIsEditMode(false);
    };

    const handleBackToPanelResults = () => {
        setShowGridView(false);
        setSelectedPanelForGrid(null);
        setShowPanelResults(true);
    };

    const handleSelectImageFromGrid = (imageIndex) => {
        setSelectedImageIndex(imageIndex);
        setShowGridView(false);
        const panelImages = panelData[selectedPanelForGrid].images;
        const selectedImg = panelImages[imageIndex];
        setSelectedImage(selectedImg.imageUrl);
        setAiDents(selectedImg.dents);
        setManualDents({});
        setModifiedAiDents({});
        setDeletedDents(new Set());
        setSelectedDent(null);
        setIsDrawingMode(false);
        setIsEditMode(false);
    };

    const handleSaveAndReturnToGrid = () => {
        if (selectedImageIndex !== null && selectedPanelForGrid) {
            const updatedDents = getAllActiveDents();
            setPanelData(prev => {
                const newData = { ...prev };
                if (newData[selectedPanelForGrid]) {
                    newData[selectedPanelForGrid].images[selectedImageIndex].dents = updatedDents;
                    const allDents = newData[selectedPanelForGrid].images.flatMap(img => Object.values(img.dents));
                    newData[selectedPanelForGrid].totalDents = allDents.length;
                    newData[selectedPanelForGrid].averageDentSize = allDents.length > 0
                        ? allDents.reduce((sum, dent) => sum + Math.sqrt(dent.x_size * dent.y_size), 0) / allDents.length
                        : 0;
                    newData[selectedPanelForGrid].dentsByCategory = allDents.reduce((acc, dent) => {
                        acc[dent.category] = (acc[dent.category] || 0) + 1;
                        return acc;
                    }, {});
                }
                return newData;
            });
        }
        handleBackToGrid();
    };

    const handleAddDent = (dent) => {
        const id = `manual-${nextDentId}`;
        setManualDents(prev => ({ ...prev, [id]: dent }));
        setNextDentId(prev => prev + 1);
        setSelectedDent(id);
    };

    const handleDeleteDent = (dentId) => {
        if (dentId.startsWith('manual-')) {
            setManualDents(prev => {
                const newDents = { ...prev };
                delete newDents[dentId];
                return newDents;
            });
        } else {
            setDeletedDents(prev => new Set([...prev, dentId]));
        }
        if (selectedDent === dentId) {
            setSelectedDent(null);
            setIsEditMode(false);
        }
    };

    const updateDent = (dentId, property, value) => {
        const updateDentData = (dent, property, value) => {
            const updated = { ...dent };
            if (property.includes('.')) {
                const [parent, child] = property.split('.');
                updated[parent] = { ...updated[parent], [child]: parseFloat(value) };
            } else {
                updated[property] = property === 'category' ? value : parseFloat(value);
            }
            return updated;
        };

        if (dentId.startsWith('manual-')) {
            setManualDents(prev => ({
                ...prev,
                [dentId]: updateDentData(prev[dentId], property, value)
            }));
        } else {
            const original = aiDents[dentId] || modifiedAiDents[dentId];
            if (original) {
                setModifiedAiDents(prev => ({
                    ...prev,
                    [dentId]: updateDentData(original, property, value)
                }));
            }
        }
    };

    const generatePDF = async (panelData, filename) => {
        try {
            const pdfMake = await loadPdfMake();

            let logoDataUrl = null;
            try {
                const logoUrl = "https://res.cloudinary.com/dtpgsm5vf/image/upload/v1736286474/OBAI_Branding_FullColorLogo_soigxk.png";
                const imgResponse = await fetch(logoUrl);
                const blob = await imgResponse.blob();
                logoDataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error('Logo load error:', error);
            }

            const totalPanels = Object.keys(panelData).length;
            const totalImages = Object.values(panelData).reduce((sum, data) => sum + data.images.length, 0);
            const totalDents = Object.values(panelData).reduce((sum, data) => sum + data.totalDents, 0);

            const docDefinition = {
                pageSize: 'A4',
                pageMargins: [40, 60, 40, 60],
                info: {
                    title: `${filename} - OBAI Dent Analysis Report`,
                    author: 'OBAI',
                    subject: 'Hail Damage Inspection Report by Panel',
                    creator: 'OBAI Dent Detection System'
                },
                header: function(currentPage, pageCount, pageSize) {
                    return {
                        columns: [
                            { text: '', width: '*' },
                            logoDataUrl && currentPage > 1 ? { image: logoDataUrl, fit: [60, 20], alignment: 'right', margin: [0, 15, 40, 0] } : { text: '', width: 60 }
                        ]
                    };
                },
                footer: function(currentPage, pageCount) {
                    return {
                        columns: [
                            { text: 'OBAI Hail Damage Panel Analysis', alignment: 'left', fontSize: 8, color: '#666', margin: [40, 20, 0, 0] },
                            { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', fontSize: 8, color: '#666', margin: [0, 20, 40, 0] }
                        ]
                    };
                },
                content: [
                    {
                        columns: [
                            {
                                width: '60%',
                                stack: [
                                    { text: 'HAIL DAMAGE', fontSize: 28, bold: true, color: '#1f2937', margin: [0, 0, 0, 5] },
                                    { text: 'PANEL ANALYSIS REPORT', fontSize: 28, bold: true, color: '#f97316', margin: [0, 0, 0, 10] }
                                ]
                            },
                            {
                                width: '40%',
                                stack: [
                                    logoDataUrl && { image: logoDataUrl, fit: [120, 40], alignment: 'right', margin: [0, 0, 0, 10] }
                                ]
                            }
                        ],
                        margin: [0, 0, 0, 20]
                    },
                    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#f97316' }], margin: [0, 0, 0, 20] },
                    
                    {
                        columns: [
                            {
                                width: '33%',
                                stack: [
                                    { text: 'Report Information', fontSize: 10, bold: true, color: '#6b7280', margin: [0, 0, 0, 8] },
                                    { text: `Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, fontSize: 9, margin: [0, 0, 0, 4] },
                                    { text: `Time: ${new Date().toLocaleTimeString('en-US')}`, fontSize: 9, margin: [0, 0, 0, 4] }
                                ]
                            },
                            {
                                width: '34%',
                                stack: [
                                    { text: 'Analysis Summary', fontSize: 10, bold: true, color: '#6b7280', margin: [0, 0, 0, 8] },
                                    { text: `Panels: ${totalPanels}`, fontSize: 9, margin: [0, 0, 0, 4] },
                                    { text: `Images: ${totalImages}`, fontSize: 9, margin: [0, 0, 0, 4] }
                                ]
                            },
                            {
                                width: '33%',
                                stack: [
                                    { text: 'Total Damage', fontSize: 10, bold: true, color: '#6b7280', margin: [0, 0, 0, 8] },
                                    { text: `${totalDents} Dents`, fontSize: 16, bold: true, color: '#f97316', margin: [0, 0, 0, 4] }
                                ]
                            }
                        ],
                        margin: [0, 0, 0, 30]
                    },

                    { text: 'PANEL BREAKDOWN', fontSize: 14, bold: true, color: '#1f2937', margin: [0, 0, 0, 15] },
                    {
                        table: {
                            headerRows: 1,
                            widths: ['*', 'auto', 'auto', 'auto'],
                            body: [
                                [
                                    { text: 'Panel', bold: true, fontSize: 10, fillColor: '#f3f4f6', color: '#1f2937' },
                                    { text: 'Images', bold: true, fontSize: 10, fillColor: '#f3f4f6', color: '#1f2937', alignment: 'center' },
                                    { text: 'Dents', bold: true, fontSize: 10, fillColor: '#f3f4f6', color: '#1f2937', alignment: 'center' },
                                    { text: 'Avg Size (px)', bold: true, fontSize: 10, fillColor: '#f3f4f6', color: '#1f2937', alignment: 'center' }
                                ],
                                ...Object.entries(panelData).map(([panel, data]) => [
                                    { text: panel, fontSize: 9 },
                                    { text: data.images.length.toString(), fontSize: 9, alignment: 'center' },
                                    { text: data.totalDents.toString(), fontSize: 9, alignment: 'center', bold: true, color: '#f97316' },
                                    { text: data.averageDentSize.toFixed(1), fontSize: 9, alignment: 'center' }
                                ]),
                                [
                                    { text: 'TOTAL', bold: true, fontSize: 10, fillColor: '#fef3c7' },
                                    { text: totalImages.toString(), bold: true, fontSize: 10, fillColor: '#fef3c7', alignment: 'center' },
                                    { text: totalDents.toString(), bold: true, fontSize: 10, fillColor: '#fef3c7', alignment: 'center', color: '#f97316' },
                                    { text: '-', bold: true, fontSize: 10, fillColor: '#fef3c7', alignment: 'center' }
                                ]
                            ]
                        },
                        layout: {
                            hLineWidth: () => 1,
                            vLineWidth: () => 1,
                            hLineColor: () => '#e5e7eb',
                            vLineColor: () => '#e5e7eb',
                            paddingLeft: () => 8,
                            paddingRight: () => 8,
                            paddingTop: () => 6,
                            paddingBottom: () => 6
                        },
                        margin: [0, 0, 0, 30]
                    },

                    { text: 'DETAILED PANEL ANALYSIS', fontSize: 14, bold: true, color: '#1f2937', margin: [0, 0, 0, 15], pageBreak: 'before' },
                    ...Object.entries(panelData).map(([panel, data]) => ({
                        stack: [
                            {
                                table: {
                                    widths: ['*'],
                                    body: [
                                        [{
                                            stack: [
                                                { text: panel, fontSize: 12, bold: true, color: '#1f2937', margin: [0, 0, 0, 8] },
                                                {
                                                    columns: [
                                                        {
                                                            width: '50%',
                                                            stack: [
                                                                { text: `Total Dents: ${data.totalDents}`, fontSize: 10, color: '#f97316', bold: true, margin: [0, 0, 0, 4] },
                                                                { text: `Images: ${data.images.length}`, fontSize: 9, color: '#4b5563', margin: [0, 0, 0, 4] },
                                                                { text: `Avg Dent Size: ${data.averageDentSize.toFixed(1)}px`, fontSize: 9, color: '#4b5563' }
                                                            ]
                                                        },
                                                        {
                                                            width: '50%',
                                                            stack: [
                                                                { text: 'Category Breakdown:', fontSize: 9, bold: true, color: '#4b5563', margin: [0, 0, 0, 4] },
                                                                ...Object.entries(data.dentsByCategory).map(([cat, count]) => ({
                                                                    text: `• ${DENT_CATEGORIES[cat]?.label}: ${count}`,
                                                                    fontSize: 8,
                                                                    color: '#6b7280',
                                                                    margin: [0, 0, 0, 2]
                                                                }))
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ],
                                            fillColor: '#f9fafb',
                                            margin: [10, 10, 10, 10]
                                        }]
                                    ]
                                },
                                layout: {
                                    hLineWidth: () => 1,
                                    vLineWidth: () => 1,
                                    hLineColor: () => '#e5e7eb',
                                    vLineColor: () => '#e5e7eb'
                                },
                                margin: [0, 0, 0, 15]
                            }
                        ]
                    })),

                    { 
                        text: 'DISCLAIMER', 
                        fontSize: 12, 
                        bold: true, 
                        color: '#1f2937', 
                        margin: [0, 30, 0, 10], 
                        pageBreak: 'before' 
                    },
                    { 
                        text: 'This report is generated by OBAI\'s AI-powered dent detection system. All dent counts, categorizations, and measurements are based on automated analysis and should be verified by a professional inspector. The information provided is for assessment purposes only and does not constitute a final damage evaluation. Average dent sizes are calculated based on pixel dimensions and may vary based on image resolution.', 
                        fontSize: 8, 
                        color: '#6b7280', 
                        italics: true,
                        margin: [0, 0, 0, 20]
                    },
                    {
                        columns: [
                            { text: '© 2024 OBAI. All rights reserved.', fontSize: 8, color: '#9ca3af', alignment: 'left' },
                            { text: 'Professional Panel-Based Dent Analysis', fontSize: 8, color: '#9ca3af', alignment: 'right' }
                        ]
                    }
                ]
            };

            pdfMake.createPdf(docDefinition).download(`${filename}.pdf`);
        } catch (error) {
            console.error('PDF generation error:', error);
            throw error;
        }
    };

    const generateZIP = async (panelData, filename) => {
        try {
            const JSZip = (await import('https://cdn.skypack.dev/jszip')).default;
            const zip = new JSZip();

            const totalDents = Object.values(panelData).reduce((sum, data) => sum + data.totalDents, 0);
            const totalImages = Object.values(panelData).reduce((sum, data) => sum + data.images.length, 0);

            const summaryData = {
                report_title: 'OBAI Hail Damage Panel Analysis Report',
                generated_at: new Date().toISOString(),
                total_panels: Object.keys(panelData).length,
                total_images: totalImages,
                total_dents: totalDents,
                panels: Object.entries(panelData).map(([panel, data]) => ({
                    panel_name: panel,
                    image_count: data.images.length,
                    total_dents: data.totalDents,
                    average_dent_size: data.averageDentSize,
                    category_breakdown: data.dentsByCategory,
                    top_category: data.topCategory
                }))
            };

            zip.file('PANEL_ANALYSIS_SUMMARY.json', JSON.stringify(summaryData, null, 2));

            Object.entries(panelData).forEach(([panel, data]) => {
                const panelFolder = zip.folder(panel.replace(/[/\\]/g, '_'));
                
                const panelSummary = {
                    panel_name: panel,
                    total_dents: data.totalDents,
                    average_dent_size: data.averageDentSize,
                    category_breakdown: data.dentsByCategory,
                    top_category: data.topCategory,
                    images: data.images.map(img => ({
                        filename: img.fileName,
                        cloudinary_url: img.imageUrl,
                        dent_count: Object.keys(img.dents).length
                    }))
                };
                
                panelFolder.file('panel_summary.json', JSON.stringify(panelSummary, null, 2));

                data.images.forEach(img => {
                    const fileName = img.fileName.replace(/\.[^/.]+$/, '');
                    const imgData = {
                        filename: img.fileName,
                        panel: panel,
                        cloudinary_url: img.imageUrl,
                        total_dents: Object.keys(img.dents).length,
                        dent_locations: img.dents
                    };
                    panelFolder.file(`${fileName}.json`, JSON.stringify(imgData, null, 2));
                });
            });

            const zipBlob = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 9 }
            });
            
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}_panel_analysis.zip`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('ZIP generation error:', error);
            throw error;
        }
    };

    const handleExport = async (filename, format) => {
        try {
            setIsExporting(true);
            setError(null);

            if (format === 'pdf') {
                if (panelMode && Object.keys(panelData).length > 0) {
                    await generatePDF(panelData, filename);
                } else if (selectedImage) {
                    const singlePanelData = {
                        'Current Image': {
                            images: [{
                                fileName: 'current-image.jpg',
                                imageUrl: selectedImage,
                                dents: getAllActiveDents()
                            }],
                            totalDents: Object.keys(getAllActiveDents()).length,
                            averageDentSize: Object.values(getAllActiveDents()).reduce((sum, dent) => 
                                sum + Math.sqrt(dent.x_size * dent.y_size), 0) / Object.keys(getAllActiveDents()).length || 0,
                            dentsByCategory: Object.values(getAllActiveDents()).reduce((acc, dent) => {
                                acc[dent.category] = (acc[dent.category] || 0) + 1;
                                return acc;
                            }, {}),
                            topCategory: 'N/A'
                        }
                    };
                    await generatePDF(singlePanelData, filename);
                }
            } else if (format === 'zip') {
                if (panelMode && Object.keys(panelData).length > 0) {
                    await generateZIP(panelData, filename);
                } else if (selectedImage) {
                    const singlePanelData = {
                        'Current Image': {
                            images: [{
                                fileName: 'current-image.jpg',
                                imageUrl: selectedImage,
                                dents: getAllActiveDents()
                            }],
                            totalDents: Object.keys(getAllActiveDents()).length,
                            averageDentSize: 0,
                            dentsByCategory: {},
                            topCategory: 'N/A'
                        }
                    };
                    await generateZIP(singlePanelData, filename);
                }
            }

            setShowExportModal(false);
        } catch (error) {
            console.error('Export error:', error);
            setError('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const toggleDrawingMode = () => {
        if (!isDrawingMode) {
            if (!hideInstructions) {
                setShowInstructionModal(true);
                return;
            }
            setIsDrawingMode(true);
            setIsEditMode(false);
            if (!selectedCategory) {
                setSelectedCategory(Object.keys(DENT_CATEGORIES)[0]);
            }
        } else {
            setIsDrawingMode(false);
            setIsEditMode(false);
        }
    };

    const startDrawingMode = () => {
        setIsDrawingMode(true);
        setIsEditMode(false);
        if (!selectedCategory) {
            setSelectedCategory(Object.keys(DENT_CATEGORIES)[0]);
        }
        setShowInstructionModal(false);
    };

    const handleImageLoad = (event) => {
        const { naturalWidth, naturalHeight } = event.target;
        setImageSize({ width: naturalWidth, height: naturalHeight });

        if (containerRef.current) {
            const container = containerRef.current;
            const scaleX = container.clientWidth / naturalWidth;
            const scaleY = container.clientHeight / naturalHeight;
            const initialScale = Math.min(scaleX, scaleY, 1) * 0.9;
            setScale(initialScale);

            const scaledWidth = naturalWidth * initialScale;
            const scaledHeight = naturalHeight * initialScale;
            setPosition({
                x: (container.clientWidth - scaledWidth) / 2,
                y: (container.clientHeight - scaledHeight) / 2
            });
        }
    };

    const allActiveDents = getAllActiveDents();
    const dentCounts = Object.values(allActiveDents).reduce((acc, dent) => {
        acc[dent.category] = (acc[dent.category] || 0) + 1;
        return acc;
    }, {});
    const totalDents = Object.values(dentCounts).reduce((sum, count) => sum + count, 0);

    const filteredDents = Object.entries(allActiveDents)
        .filter(([_, dent]) => !filterCategory || dent.category === filterCategory);

    const currentSelectedDent = selectedDent ? (
        selectedDent.startsWith('manual-') ? manualDents[selectedDent] :
        modifiedAiDents[selectedDent] || aiDents[selectedDent]
    ) : null;

    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0 || isDrawingMode) return;
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }, [position, isDrawingMode]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const adjustScale = useCallback((delta) => {
        setScale(prev => Math.min(Math.max(MIN_SCALE, prev + delta), MAX_SCALE));
    }, []);

    useEffect(() => {
        const pref = localStorage.getItem('hideDentInstructions');
        if (pref === 'true') setHideInstructions(true);
    }, []);

    useEffect(() => {
        const wheelHandler = (e) => {
            if (!selectedImage) return;
            e.preventDefault();
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const delta = e.deltaY * -0.01;
            const newScale = Math.min(Math.max(MIN_SCALE, scale + delta), MAX_SCALE);

            const scaleChange = newScale - scale;
            const newPosition = {
                x: position.x - ((x - position.x) * scaleChange) / scale,
                y: position.y - ((y - position.y) * scaleChange) / scale
            };

            setScale(newScale);
            setPosition(newPosition);
        };

        const currentContainer = containerRef.current;
        if (currentContainer) {
            currentContainer.addEventListener('wheel', wheelHandler, { passive: false });
            return () => currentContainer.removeEventListener('wheel', wheelHandler);
        }
    }, [scale, position, selectedImage]);

    // Grid view
    if (showGridView && selectedPanelForGrid && panelData[selectedPanelForGrid]) {
        return (
            <PanelImagesGridView
                isOpen={showGridView}
                onClose={handleBackToPanelResults}
                panel={selectedPanelForGrid}
                images={panelData[selectedPanelForGrid].images}
                onSelectImage={handleSelectImageFromGrid}
            />
        );
    }

    // Panel results view
    if (panelMode && showPanelResults && Object.keys(panelData).length > 0) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <BatchProcessingModal isOpen={isBatchProcessing} processedCount={batchProgress.processed} totalCount={batchProgress.total} currentFile={batchProgress.currentFile} failedFiles={batchFailedFiles} />
                <ExportModal 
                    isOpen={showExportModal} 
                    onClose={() => setShowExportModal(false)} 
                    onExport={handleExport} 
                    isBatch={true} 
                    imageCount={Object.values(panelData).reduce((sum, data) => sum + data.images.length, 0)}
                    panelData={panelData}
                />
                <PanelSelectionModal 
                    isOpen={showPanelModal} 
                    onClose={() => {
                        setShowPanelModal(false);
                        setPendingFiles([]);
                    }} 
                    onSelect={handlePanelSelect} 
                />
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6 flex items-center gap-4">
                        <button onClick={() => folderInputRef.current.click()} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center gap-3 shadow-md transition-all">
                            <Plus className="w-5 h-5" />Add More Panels
                        </button>
                        <input ref={folderInputRef} type="file" multiple webkitdirectory="" directory="" accept="image/*" onChange={handleFolderUpload} className="hidden" />
                    </div>
                    <PanelResultsView 
                        panelData={panelData}
                        onSelectPanel={handlePanelClick}
                        onExportAll={() => setShowExportModal(true)} 
                        onClearAll={() => {
                            setPanelData({});
                            setPanelMode(false);
                            setShowPanelResults(false);
                        }} 
                    />
                </div>
            </div>
        );
    }

    // Determine if editing from grid
    const isEditingGridImage = selectedImageIndex !== null && selectedPanelForGrid;
    const currentImageName = isEditingGridImage ? panelData[selectedPanelForGrid]?.images[selectedImageIndex]?.fileName || '' : '';

    // Main editor view (handles both single image and grid image editing)
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <InstructionModal isOpen={showInstructionModal} onClose={() => setShowInstructionModal(false)} onDontShowAgain={() => { setHideInstructions(true); localStorage.setItem('hideDentInstructions', 'true'); }} onStartAnnotating={startDrawingMode} />
            <ExportModal 
                isOpen={showExportModal} 
                onClose={() => setShowExportModal(false)} 
                onExport={handleExport} 
                isBatch={panelMode} 
                imageCount={panelMode ? Object.values(panelData).reduce((sum, data) => sum + data.images.length, 0) : 1}
                panelData={panelMode ? panelData : null}
            />
            <BatchProcessingModal isOpen={isBatchProcessing} processedCount={batchProgress.processed} totalCount={batchProgress.total} currentFile={batchProgress.currentFile} failedFiles={batchFailedFiles} />
            <PanelSelectionModal 
                isOpen={showPanelModal} 
                onClose={() => {
                    setShowPanelModal(false);
                    setPendingFiles([]);
                }} 
                onSelect={handlePanelSelect} 
            />

            {/* Special header when editing from grid */}
            {isEditingGridImage && (
                <div className="w-full p-4 bg-white border-b shadow-sm">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={handleBackToGrid} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                                <ArrowLeft className="w-5 h-5" />
                                <span className="font-medium">Back to Grid</span>
                            </button>
                            <div className="text-sm text-gray-600">{selectedPanelForGrid} • {currentImageName}</div>
                        </div>
                        <button onClick={handleSaveAndReturnToGrid} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-md">
                            <Save className="w-5 h-5" />Save & Return to Grid
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row flex-1">
                {/* Sidebar */}
                <div className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 p-6 shadow-lg order-2 lg:order-1">
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold mb-2 text-gray-800">Results Summary</h2>
                        <p className="text-3xl font-bold text-orange-600">{totalDents} Dents</p>
                        {(currentPanel || isEditingGridImage) && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                <Car className="w-4 h-4" />
                                <span className="font-medium">{isEditingGridImage ? selectedPanelForGrid : currentPanel}</span>
                            </div>
                        )}
                        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-xs text-amber-700 text-center">AI analysis requires professional verification</p>
                        </div>
                    </div>

                    {selectedDent && currentSelectedDent && (
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Selected Dent</h2>
                            {isEditMode ? (
                                <div className="p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-300">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-800">Edit Dent</span>
                                        <button onClick={() => setIsEditMode(false)} className="p-1 rounded hover:bg-gray-200 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select value={currentSelectedDent.category} onChange={(e) => updateDent(selectedDent, 'category', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500">
                                            {Object.entries(DENT_CATEGORIES).map(([key, { label }]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">X Position</label>
                                            <input type="number" value={Math.round(currentSelectedDent.center.x)} onChange={(e) => updateDent(selectedDent, 'center.x', e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Y Position</label>
                                            <input type="number" value={Math.round(currentSelectedDent.center.y)} onChange={(e) => updateDent(selectedDent, 'center.y', e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                                            <input type="number" value={Math.round(currentSelectedDent.x_size)} onChange={(e) => updateDent(selectedDent, 'x_size', e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
                                            <input type="number" value={Math.round(currentSelectedDent.y_size)} onChange={(e) => updateDent(selectedDent, 'y_size', e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t">
                                        <button onClick={() => handleDeleteDent(selectedDent)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded flex items-center gap-1 text-sm transition-colors">
                                            <Trash2 className="w-4 h-4" />Delete
                                        </button>
                                        <button onClick={() => setIsEditMode(false)} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded flex items-center gap-1 text-sm transition-colors">
                                            <Save className="w-4 h-4" />Done
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: DENT_CATEGORIES[currentSelectedDent.category].color }} />
                                            <span className="font-semibold text-gray-800">{DENT_CATEGORIES[currentSelectedDent.category].label}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setIsEditMode(true)} className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors" title="Edit dent">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteDent(selectedDent)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete dent">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div className="bg-white p-2 rounded border">
                                            <div className="text-xs text-gray-500 mb-1">Position</div>
                                            <div className="font-mono">({Math.round(currentSelectedDent.center.x)}, {Math.round(currentSelectedDent.center.y)})</div>
                                        </div>
                                        <div className="bg-white p-2 rounded border">
                                            <div className="text-xs text-gray-500 mb-1">Size</div>
                                            <div className="font-mono">{Math.round(currentSelectedDent.x_size)}×{Math.round(currentSelectedDent.y_size)}px</div>
                                        </div>
                                        <div className="bg-white p-2 rounded border">
                                            <div className="text-xs text-gray-500 mb-1">Area</div>
                                            <div className="font-mono">{Math.round(currentSelectedDent.x_size * currentSelectedDent.y_size)} px²</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Categories</h2>
                        {filterCategory && (
                            <button onClick={() => setFilterCategory(null)} className="flex items-center justify-center w-full p-2 mb-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 transition-all">
                                <X className="w-4 h-4 mr-2" />Reset Filter
                            </button>
                        )}
                        <div className="space-y-3">
                            {Object.entries(DENT_CATEGORIES).map(([key, { color, label }]) => (
                                <div
                                    key={key}
                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${filterCategory === key ? 'bg-gray-100 shadow-sm' : 'hover:bg-gray-50'} ${isDrawingMode && selectedCategory === key ? 'ring-2 ring-orange-500 bg-orange-50' : ''}`}
                                    onClick={() => {
                                        if (isDrawingMode) setSelectedCategory(key);
                                        else setFilterCategory(filterCategory === key ? null : key);
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                        <span className="font-medium text-gray-800">{label}</span>
                                    </div>
                                    <span className="text-lg font-semibold text-gray-800">{dentCounts[key] || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {(selectedImage || panelMode) && (
                        <div className="mt-8 space-y-3">
                            <button onClick={() => setShowExportModal(true)} disabled={isExporting} className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg border border-orange-600 shadow-md transition-all disabled:opacity-50">
                                <Download className="w-5 h-5" />{isExporting ? 'Exporting...' : 'Export Analysis'}
                            </button>
                            <button onClick={() => window.open('https://calendly.com/team-obai/intro-conversation', '_blank')} className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-3 rounded-lg border border-blue-200 transition-all">
                                <Calendar className="w-5 h-5" />Request Batch Access
                            </button>
                        </div>
                    )}
                </div>

                {/* Main editor */}
                <div className="flex-1 p-6 order-1 lg:order-2">
                    <div className="bg-white rounded-xl shadow-xl p-6 h-full flex flex-col">
                        <div className="mb-6 space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                {panelMode && currentPanel && !isEditingGridImage && (
                                    <button onClick={() => {
                                        setShowPanelResults(true);
                                        setSelectedImage(null);
                                        setCurrentPanel(null);
                                    }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg flex items-center gap-3 shadow-sm transition-all">
                                        <ArrowLeft className="w-5 h-5" />Back to Panels
                                    </button>
                                )}
                                
                                {!isEditingGridImage && (
                                    <>
                                        <button onClick={() => fileInputRef.current.click()} disabled={isLoading} className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-3 rounded-lg flex items-center gap-3 font-medium shadow-md transition-all">
                                            <Upload className="w-5 h-5" />{isLoading ? 'Processing...' : 'Upload Image'}
                                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                        </button>
                                        <button onClick={() => folderInputRef.current.click()} disabled={isLoading || isBatchProcessing} className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg flex items-center gap-3 font-medium shadow-md transition-all">
                                            <FolderOpen className="w-5 h-5" />{isBatchProcessing ? 'Processing...' : 'Upload by Panel (Max 100)'}
                                            <input ref={folderInputRef} type="file" multiple webkitdirectory="" directory="" accept="image/*" onChange={handleFolderUpload} className="hidden" />
                                        </button>
                                    </>
                                )}

                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
                                    <button onClick={() => adjustScale(-SCALE_STEP)} disabled={scale <= MIN_SCALE} className="px-3 py-1.5 bg-white hover:bg-gray-100 disabled:opacity-50 rounded shadow-sm transition-all">
                                        <ZoomOut className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm px-2 font-mono text-gray-700 min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
                                    <button onClick={() => adjustScale(SCALE_STEP)} disabled={scale >= MAX_SCALE} className="px-3 py-1.5 bg-white hover:bg-gray-100 disabled:opacity-50 rounded shadow-sm transition-all">
                                        <ZoomIn className="w-4 h-4" />
                                    </button>
                                </div>

                                <button onClick={toggleDrawingMode} disabled={!selectedImage} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-sm transition-all ${isDrawingMode ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg' : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                    <Edit2 className="w-5 h-5" />
                                    {isDrawingMode ? 'Exit Annotate' : 'Annotate'}
                                </button>
                            </div>

                            {isDrawingMode && (
                                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                                            <span className="font-semibold text-orange-800">Annotation Mode Active</span>
                                            {selectedCategory && (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-orange-200 shadow-sm">
                                                    <span className="text-sm text-gray-600">Drawing:</span>
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DENT_CATEGORIES[selectedCategory].color }} />
                                                    <span className="font-medium text-sm text-gray-800">{DENT_CATEGORIES[selectedCategory].label}</span>
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => setShowInstructionModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors">
                                            <Info className="w-4 h-4" />Help
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div
                            ref={containerRef}
                            className={`relative flex-1 bg-gray-100 rounded-lg overflow-hidden min-h-96 ${isDrawingMode ? 'cursor-crosshair ring-2 ring-orange-300 ring-opacity-50' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onClick={() => {
                                if (!isDrawingMode) {
                                    setSelectedDent(null);
                                    setIsEditMode(false);
                                }
                            }}
                        >
                            <div
                                className="absolute origin-top-left"
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                    transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                                }}
                            >
                                {selectedImage && (
                                    <div className="relative">
                                        <img ref={imageRef} src={selectedImage} alt="Dent Analysis" className="max-w-none block" onLoad={handleImageLoad} style={{ userSelect: 'none' }} />
                                        {filteredDents.map(([id, dent]) => (
                                            <DentOverlay
                                                key={id}
                                                dentId={id}
                                                dent={dent}
                                                category={DENT_CATEGORIES[dent.category]}
                                                imageSize={imageSize}
                                                isSelected={selectedDent === id}
                                                onSelect={() => {
                                                    if (!isDrawingMode) {
                                                        setSelectedDent(id);
                                                        setIsEditMode(false);
                                                    }
                                                }}
                                                scale={scale}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {isDrawingMode && selectedImage && (
                                <DrawingCanvas
                                    imageRef={imageRef}
                                    scale={scale}
                                    position={position}
                                    onAddDent={handleAddDent}
                                    currentCategory={selectedCategory}
                                    onFinishDrawing={() => {}}
                                />
                            )}

                            {!selectedImage && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-400 text-lg">Upload an image or organize by vehicle panel</p>
                                        <p className="text-gray-400 text-sm mt-2">Single images or batch processing by panel (up to 100 images)</p>
                                    </div>
                                </div>
                            )}

                            {isLoading && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                    <div className="bg-white rounded-lg p-6 shadow-xl">
                                        <div className="flex items-center gap-3">
                                            <Loader className="animate-spin h-8 w-8 text-orange-500" />
                                            <div className="text-xl font-medium">Processing image...</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="mt-4 flex flex-col sm:flex-row justify-between text-gray-600 text-sm gap-2">
                            <div>
                                {imageSize.width > 0 && `Image: ${imageSize.width}×${imageSize.height}px`}
                                {(currentPanel || isEditingGridImage) && ` • Panel: ${isEditingGridImage ? selectedPanelForGrid : currentPanel}`}
                            </div>
                            <div className="flex items-center gap-4">
                                <div>Zoom: {Math.round(scale * 100)}%</div>
                                {totalDents > 0 && <div className="font-medium text-orange-600">{totalDents} dents detected</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}