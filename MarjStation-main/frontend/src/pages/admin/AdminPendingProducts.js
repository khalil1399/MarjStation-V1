import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';
import { sellerProductService } from '../../services/firebase/sellerProductService';
import { userService } from '../../services/firebase/userService';
import { 
  Loader2, 
  Package, 
  Store, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  Eye,
  FileText,
  User,
  Mail,
  Calendar,
  ArrowUpDown,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const AdminPendingProducts = () => {
  const [pendingProducts, setPendingProducts] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [requestTypeFilter, setRequestTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const unsubscribe = sellerProductService.listenToPendingProducts((products) => {
      setPendingProducts(products);
      setLoading(false);
    });

    loadUsers();

    return () => unsubscribe();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await userService.getAllUsers();
      const usersMap = {};
      allUsers.forEach(user => {
        usersMap[user.id] = user;
      });
      setUsers(usersMap);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...pendingProducts];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.productType === typeFilter);
    }

    // Apply request type filter
    if (requestTypeFilter !== 'all') {
      filtered = filtered.filter(p => {
        if (requestTypeFilter === 'new') return !p.requestType || p.requestType === 'new';
        return p.requestType === requestTypeFilter;
      });
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => {
        const seller = users[p.sellerId] || {};
        return (
          p.name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          seller.name?.toLowerCase().includes(term) ||
          seller.email?.toLowerCase().includes(term)
        );
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.submittedAt);
      const dateB = new Date(b.submittedAt);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [pendingProducts, statusFilter, typeFilter, requestTypeFilter, searchTerm, sortOrder, users]);

  const stats = useMemo(() => ({
    total: pendingProducts.length,
    pending: pendingProducts.filter(p => p.status === 'pending').length,
    newProducts: pendingProducts.filter(p => p.status === 'pending' && (!p.requestType || p.requestType === 'new')).length,
    editRequests: pendingProducts.filter(p => p.status === 'pending' && p.requestType === 'edit').length,
    deleteRequests: pendingProducts.filter(p => p.status === 'pending' && p.requestType === 'delete').length
  }), [pendingProducts]);

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const { color, icon: Icon } = config[status] || config.pending;
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRequestTypeBadge = (requestType) => {
    if (requestType === 'edit') {
      return <Badge className="bg-blue-100 text-blue-800"><Edit className="h-3 w-3 mr-1" />Edit</Badge>;
    }
    if (requestType === 'delete') {
      return <Badge className="bg-red-100 text-red-800"><Trash2 className="h-3 w-3 mr-1" />Delete</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800"><Package className="h-3 w-3 mr-1" />New</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOpenAction = (product, type) => {
    setSelectedProduct(product);
    setActionType(type);
    setFeedback('');
    setActionDialogOpen(true);
  };

  const handleProcessAction = async () => {
    if (!selectedProduct) return;

    setProcessing(true);
    try {
      if (actionType === 'approve') {
        // Handle different request types
        if (selectedProduct.requestType === 'edit') {
          await sellerProductService.approveEditRequest(selectedProduct.id, feedback);
          toast({ title: 'Edit request approved', description: 'The product has been updated.' });
        } else if (selectedProduct.requestType === 'delete') {
          await sellerProductService.approveDeletionRequest(selectedProduct.id, feedback);
          toast({ title: 'Deletion approved', description: 'The product has been removed.' });
        } else {
          await sellerProductService.approveProduct(selectedProduct.id, feedback);
          toast({ title: 'Product approved', description: 'The product is now live.' });
        }
      } else {
        await sellerProductService.rejectProduct(selectedProduct.id, feedback);
        toast({ title: 'Request rejected', description: 'The seller has been notified.' });
      }
      setActionDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="admin-pending-products">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Seller Product Reviews</h1>
        <p className="text-gray-600 mt-1">Review and approve seller-submitted products and changes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">New Products</p>
              <p className="text-2xl font-bold text-green-600">{stats.newProducts}</p>
            </div>
            <Package className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Edit Requests</p>
              <p className="text-2xl font-bold text-blue-600">{stats.editRequests}</p>
            </div>
            <Edit className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Delete Requests</p>
              <p className="text-2xl font-bold text-red-600">{stats.deleteRequests}</p>
            </div>
            <Trash2 className="h-8 w-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">All Time</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by product name, seller name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-white"
              data-testid="status-filter"
            >
              <option value="pending">Pending</option>
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-white"
              data-testid="type-filter"
            >
              <option value="all">All Types</option>
              <option value="restaurant">Restaurants</option>
              <option value="menuItem">Menu Items</option>
            </select>
            <select
              value={requestTypeFilter}
              onChange={(e) => setRequestTypeFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-white"
              data-testid="request-type-filter"
            >
              <option value="all">All Requests</option>
              <option value="new">New Products</option>
              <option value="edit">Edit Requests</option>
              <option value="delete">Delete Requests</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              data-testid="sort-order-btn"
            >
              <ArrowUpDown className="h-4 w-4 mr-1" />
              {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {statusFilter === 'pending' ? 'All Caught Up!' : 'No Products Found'}
          </h3>
          <p className="text-gray-600">
            {statusFilter === 'pending' 
              ? 'There are no pending product reviews at the moment.'
              : 'No products match your current filters.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const seller = users[product.sellerId] || {};
            return (
              <Card key={product.id} className="p-5" data-testid={`pending-product-${product.id}`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : product.productType === 'restaurant' ? (
                        <Store className="h-10 w-10 text-gray-400" />
                      ) : (
                        <Package className="h-10 w-10 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{product.name || 'Unnamed'}</h3>
                        {getStatusBadge(product.status)}
                        {getRequestTypeBadge(product.requestType)}
                        <Badge variant="outline">
                          {product.productType === 'restaurant' ? 'Restaurant' : 'Menu Item'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 max-w-xl mb-2">
                        {product.description || (product.requestType === 'delete' ? 'Requesting to delete this product' : 'No description')}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {seller.name || 'Unknown Seller'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {seller.email || product.sellerEmail || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(product.submittedAt)}
                        </span>
                        {product.price && (
                          <span className="font-medium text-green-600">${product.price}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedProduct(product);
                        setViewDialogOpen(true);
                      }}
                      data-testid={`view-btn-${product.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {product.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleOpenAction(product, 'approve')}
                          data-testid={`approve-btn-${product.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleOpenAction(product, 'reject')}
                          data-testid={`reject-btn-${product.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Deletion Warning */}
                {product.requestType === 'delete' && product.status === 'pending' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Deletion Request</p>
                      <p className="text-sm text-red-700">
                        {product.deletionReason || 'The seller wants to remove this product from the platform.'}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProduct?.productType === 'restaurant' ? (
                <Store className="h-5 w-5 text-green-600" />
              ) : (
                <Package className="h-5 w-5 text-blue-600" />
              )}
              Product Details
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold">{selectedProduct.name || 'Unnamed'}</h3>
                {getStatusBadge(selectedProduct.status)}
                {getRequestTypeBadge(selectedProduct.requestType)}
              </div>

              {selectedProduct.image && (
                <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Seller Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Seller Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <p className="font-medium">{users[selectedProduct.sellerId]?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{users[selectedProduct.sellerId]?.email || selectedProduct.sellerEmail || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <p className="font-medium">{selectedProduct.productType === 'restaurant' ? 'Restaurant' : 'Menu Item'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Request:</span>
                  <p className="font-medium">
                    {selectedProduct.requestType === 'edit' ? 'Edit Request' :
                     selectedProduct.requestType === 'delete' ? 'Delete Request' : 'New Product'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Submitted:</span>
                  <p className="font-medium">{formatDate(selectedProduct.submittedAt)}</p>
                </div>
                {selectedProduct.price && (
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <p className="font-medium text-green-600">${selectedProduct.price}</p>
                  </div>
                )}
              </div>

              {selectedProduct.description && (
                <div>
                  <span className="text-gray-500 text-sm">Description:</span>
                  <p className="text-gray-900">{selectedProduct.description}</p>
                </div>
              )}

              {selectedProduct.category && (
                <div>
                  <span className="text-gray-500 text-sm">Category:</span>
                  <p className="text-gray-900">{selectedProduct.category}</p>
                </div>
              )}

              {selectedProduct.address && (
                <div>
                  <span className="text-gray-500 text-sm">Address:</span>
                  <p className="text-gray-900">{selectedProduct.address}</p>
                </div>
              )}

              {selectedProduct.deletionReason && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="font-medium text-red-800 mb-1">Reason for Deletion:</p>
                  <p className="text-red-700">{selectedProduct.deletionReason}</p>
                </div>
              )}

              {selectedProduct.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleOpenAction(selectedProduct, 'approve');
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleOpenAction(selectedProduct, 'reject');
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  {selectedProduct?.requestType === 'delete' ? 'Approve Deletion' : 
                   selectedProduct?.requestType === 'edit' ? 'Approve Edit' : 'Approve Product'}
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Reject Request
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">{selectedProduct?.name || 'Unnamed'}</p>
              <p className="text-sm text-gray-500">
                {selectedProduct?.productType === 'restaurant' ? 'Restaurant' : 'Menu Item'}
                {selectedProduct?.requestType && ` • ${selectedProduct.requestType.charAt(0).toUpperCase() + selectedProduct.requestType.slice(1)} Request`}
              </p>
            </div>

            {actionType === 'approve' && selectedProduct?.requestType === 'delete' && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This will permanently remove the product from the platform.
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="feedback">
                {actionType === 'approve' ? 'Approval Message (Optional)' : 'Rejection Reason'}
              </Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={actionType === 'approve' 
                  ? 'Your product has been approved...'
                  : 'Please provide a reason for rejection...'}
                rows={3}
                data-testid="action-feedback"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className={`flex-1 ${actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                onClick={handleProcessAction}
                disabled={processing}
                data-testid="confirm-action-btn"
              >
                {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPendingProducts;
