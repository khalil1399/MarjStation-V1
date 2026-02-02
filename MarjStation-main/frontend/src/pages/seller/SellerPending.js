import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useAuth } from '../../context/AuthContext';
import { sellerProductService } from '../../services/firebase/sellerProductService';
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
  Trash2,
  FileText
} from 'lucide-react';
import { toast } from '../../hooks/use-toast';

const SellerPending = () => {
  const { currentUser } = useAuth();
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = sellerProductService.listenToSellerPendingProducts(
        currentUser.uid,
        (products) => {
          setPendingProducts(products);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }
  }, [currentUser]);

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

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [pendingProducts, statusFilter, typeFilter, searchTerm]);

  const stats = useMemo(() => ({
    total: pendingProducts.length,
    pending: pendingProducts.filter(p => p.status === 'pending').length,
    approved: pendingProducts.filter(p => p.status === 'approved').length,
    rejected: pendingProducts.filter(p => p.status === 'rejected').length
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
      return <Badge variant="outline" className="text-blue-600 border-blue-300">Edit Request</Badge>;
    }
    if (requestType === 'delete') {
      return <Badge variant="outline" className="text-red-600 border-red-300">Delete Request</Badge>;
    }
    return <Badge variant="outline" className="text-green-600 border-green-300">New</Badge>;
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

  const handleDeletePending = async (productId) => {
    if (!window.confirm('Are you sure you want to cancel this submission?')) return;
    
    try {
      await sellerProductService.deletePendingProduct(productId);
      toast({ title: 'Submission cancelled successfully' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="seller-pending">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-600 mt-1">Track the status of your product submissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Submissions</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-pending"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-white"
                data-testid="status-filter"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
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
          </div>
        </div>
      </Card>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'No submissions match your filters.'
              : 'You have not submitted any products yet.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="p-4" data-testid={`pending-item-${product.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : product.productType === 'restaurant' ? (
                      <Store className="h-8 w-8 text-gray-400" />
                    ) : (
                      <Package className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{product.name || 'Unnamed'}</h3>
                      {getStatusBadge(product.status)}
                      {getRequestTypeBadge(product.requestType)}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1 max-w-md">
                      {product.description || (product.requestType === 'delete' ? 'Deletion request' : 'No description')}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        {product.productType === 'restaurant' ? (
                          <Store className="h-3 w-3" />
                        ) : (
                          <Package className="h-3 w-3" />
                        )}
                        {product.productType === 'restaurant' ? 'Restaurant' : 'Menu Item'}
                      </span>
                      <span>Submitted: {formatDate(product.submittedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedProduct(product);
                      setViewDialogOpen(true);
                    }}
                    data-testid={`view-pending-${product.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  {product.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePending(product.id)}
                      data-testid={`cancel-pending-${product.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              {/* Admin Feedback */}
              {product.adminFeedback && (
                <div className={`mt-3 p-3 rounded-lg ${
                  product.status === 'approved' ? 'bg-green-50' : 
                  product.status === 'rejected' ? 'bg-red-50' : 'bg-gray-50'
                }`}>
                  <p className="text-sm font-medium text-gray-700">Admin Feedback:</p>
                  <p className="text-sm text-gray-600">{product.adminFeedback}</p>
                </div>
              )}
            </Card>
          ))}
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
              Submission Details
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

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <p className="font-medium">
                    {selectedProduct.productType === 'restaurant' ? 'Restaurant' : 'Menu Item'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Request Type:</span>
                  <p className="font-medium">
                    {selectedProduct.requestType === 'edit' ? 'Edit Request' :
                     selectedProduct.requestType === 'delete' ? 'Delete Request' : 'New Product'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Submitted:</span>
                  <p className="font-medium">{formatDate(selectedProduct.submittedAt)}</p>
                </div>
                {selectedProduct.approvedAt && (
                  <div>
                    <span className="text-gray-500">Approved:</span>
                    <p className="font-medium">{formatDate(selectedProduct.approvedAt)}</p>
                  </div>
                )}
                {selectedProduct.rejectedAt && (
                  <div>
                    <span className="text-gray-500">Rejected:</span>
                    <p className="font-medium">{formatDate(selectedProduct.rejectedAt)}</p>
                  </div>
                )}
              </div>

              {selectedProduct.description && (
                <div>
                  <span className="text-gray-500 text-sm">Description:</span>
                  <p className="text-gray-900">{selectedProduct.description}</p>
                </div>
              )}

              {selectedProduct.price && (
                <div>
                  <span className="text-gray-500 text-sm">Price:</span>
                  <p className="text-lg font-bold text-green-600">${selectedProduct.price}</p>
                </div>
              )}

              {selectedProduct.adminFeedback && (
                <div className={`p-4 rounded-lg ${
                  selectedProduct.status === 'approved' ? 'bg-green-50 border border-green-200' : 
                  selectedProduct.status === 'rejected' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                }`}>
                  <p className="font-medium text-gray-700 mb-1">Admin Feedback:</p>
                  <p className="text-gray-600">{selectedProduct.adminFeedback}</p>
                </div>
              )}

              {selectedProduct.deletionReason && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-700 mb-1">Reason for Deletion:</p>
                  <p className="text-gray-600">{selectedProduct.deletionReason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerPending;
