// ============================================
// FILE: backend/controllers/invoiceController.js
// PDF Invoice Generation using PDFKit
// ============================================
import PDFDocument from 'pdfkit';
import Order from '../models/orderModel.js';

/**
 * Generate and download PDF invoice for an order
 * Route: GET /api/orders/:id/invoice
 * Access: Public (no auth required) or Optional auth
 */
export const generateInvoice = async (req, res) => {
    try {
        const orderId = req.params.id;
        
        console.log('📄 Generating invoice for order ID:', orderId);
        
        // Fetch order from database
        const order = await Order.findById(orderId)
            .populate('user', 'name email')
            .lean();

        if (!order) {
            console.error('❌ Order not found:', orderId);
            return res.status(404).json({ 
                success: false,
                message: 'Order not found' 
            });
        }

        console.log('✅ Order found:', order.orderId);
        console.log('   Items:', order.items?.length || 0);
        console.log('   Customer:', order.customer?.name);

        // ==================== CALCULATE TOTALS ====================
        // Calculate subtotal from items
        const subtotal = order.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);

        // Get shipping from order or calculate
        const shipping = order.shipping || 0;

        // Calculate tax (5% of subtotal)
        const tax = subtotal * 0.05;

        // Calculate total
        const total = subtotal + tax + shipping;

        console.log('💰 Calculated totals:');
        console.log('   Subtotal: ₹', subtotal.toFixed(2));
        console.log('   Tax (5%): ₹', tax.toFixed(2));
        console.log('   Shipping: ₹', shipping.toFixed(2));
        console.log('   Total: ₹', total.toFixed(2));

        // Create PDF document
        const doc = new PDFDocument({ 
            size: 'A4',
            margin: 50,
            bufferPages: true
        });

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition', 
            `attachment; filename=Invoice_${order.orderId}.pdf`
        );
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // Pipe PDF to response
        doc.pipe(res);

        // ==================== HEADER ====================
        doc.fontSize(28)
           .fillColor('#10b981')
           .text('RUSHBASKET', 50, 50)
           .fontSize(10)
           .fillColor('#666')
           .text('Fresh Groceries Delivered to Your Door', 50, 85);

        // Invoice Title
        doc.fontSize(24)
           .fillColor('#000')
           .text('INVOICE', 400, 50, { align: 'right' });

        // Horizontal line
        doc.moveTo(50, 110)
           .lineTo(550, 110)
           .strokeColor('#10b981')
           .lineWidth(2)
           .stroke();

        // ==================== ORDER INFO ====================
        let yPos = 140;
        
        doc.fontSize(10)
           .fillColor('#666')
           .text('Order ID:', 50, yPos)
           .fillColor('#000')
           .font('Helvetica-Bold')
           .text(order.orderId, 150, yPos);

        yPos += 20;
        doc.font('Helvetica')
           .fillColor('#666')
           .text('Order Date:', 50, yPos)
           .fillColor('#000')
           .text(new Date(order.createdAt || order.date).toLocaleDateString('en-IN', {
               year: 'numeric',
               month: 'long',
               day: 'numeric',
               hour: '2-digit',
               minute: '2-digit'
           }), 150, yPos);

        yPos += 20;
        doc.fillColor('#666')
           .text('Payment Method:', 50, yPos)
           .fillColor('#000')
           .text(order.paymentMethod || 'N/A', 150, yPos);

        yPos += 20;
        doc.fillColor('#666')
           .text('Payment Status:', 50, yPos)
           .fillColor(order.paymentStatus === 'Paid' ? '#10b981' : '#ef4444')
           .font('Helvetica-Bold')
           .text(order.paymentStatus || 'Pending', 150, yPos);

        yPos += 20;
        doc.font('Helvetica')
           .fillColor('#666')
           .text('Order Status:', 50, yPos)
           .fillColor('#000')
           .text(order.status || 'Pending', 150, yPos);

        // ==================== CUSTOMER INFO ====================
        yPos = 140;
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .fillColor('#000')
           .text('BILL TO:', 350, yPos);

        yPos += 25;
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#000')
           .text(order.customer?.name || 'N/A', 350, yPos);

        yPos += 15;
        doc.fillColor('#666')
           .text(order.customer?.email || 'N/A', 350, yPos);

        yPos += 15;
        doc.text(order.customer?.phone || 'N/A', 350, yPos);

        yPos += 20;
        const address = order.customer?.address || 'N/A';
        const addressLines = address.match(/.{1,35}/g) || [address];
        addressLines.forEach(line => {
            doc.text(line.trim(), 350, yPos);
            yPos += 15;
        });

        // ==================== ITEMS TABLE ====================
        yPos = 320;

        // Table header
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#fff')
           .rect(50, yPos, 500, 30)
           .fillAndStroke('#10b981', '#10b981');

        doc.fillColor('#fff')
           .text('Item', 60, yPos + 10)
           .text('Qty', 320, yPos + 10, { width: 50, align: 'center' })
           .text('Price', 380, yPos + 10, { width: 70, align: 'right' })
           .text('Total', 460, yPos + 10, { width: 80, align: 'right' });

        yPos += 30;

        // Table rows
        doc.font('Helvetica')
           .fontSize(10);

        if (!order.items || order.items.length === 0) {
            doc.fillColor('#666')
               .text('No items found', 60, yPos + 10);
            yPos += 40;
        } else {
            order.items.forEach((item, index) => {
                const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
                
                // Draw row background
                doc.rect(50, yPos, 500, 35)
                   .fillAndStroke(bgColor, '#e5e7eb');

                const itemTotal = (item.price || 0) * (item.quantity || 0);

                // Item name (with wrapping)
                doc.fillColor('#000')
                   .text(item.name || 'Unknown Item', 60, yPos + 10, { 
                       width: 240,
                       lineBreak: true 
                   });

                // Quantity
                doc.text(
                    (item.quantity || 0).toString(), 
                    320, 
                    yPos + 10, 
                    { width: 50, align: 'center' }
                );

                // Unit price
                doc.text(
                    `₹${(item.price || 0).toFixed(2)}`, 
                    380, 
                    yPos + 10, 
                    { width: 70, align: 'right' }
                );

                // Item total
                doc.text(
                    `₹${itemTotal.toFixed(2)}`, 
                    460, 
                    yPos + 10, 
                    { width: 80, align: 'right' }
                );

                yPos += 35;
            });
        }

        // ==================== TOTALS ====================
        yPos += 20;

        // Subtotal
        doc.fontSize(10)
           .fillColor('#666')
           .text('Subtotal:', 380, yPos)
           .fillColor('#000')
           .text(`₹${subtotal.toFixed(2)}`, 460, yPos, { width: 80, align: 'right' });

        yPos += 20;

        // Tax
        doc.fillColor('#666')
           .text('Tax (5%):', 380, yPos)
           .fillColor('#000')
           .text(`₹${tax.toFixed(2)}`, 460, yPos, { width: 80, align: 'right' });

        yPos += 20;

        // Shipping
        doc.fillColor('#666')
           .text('Shipping:', 380, yPos)
           .fillColor('#000')
           .text(
               shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`, 
               460, 
               yPos, 
               { width: 80, align: 'right' }
           );

        yPos += 5;

        // Total line
        doc.moveTo(380, yPos)
           .lineTo(550, yPos)
           .strokeColor('#000')
           .lineWidth(1)
           .stroke();

        yPos += 15;

        // Grand Total
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#10b981')
           .text('Total Amount:', 380, yPos)
           .fontSize(14)
           .text(`₹${total.toFixed(2)}`, 460, yPos, { width: 80, align: 'right' });

        // ==================== FOOTER ====================
        const footerY = 750;
        
        doc.fontSize(9)
           .fillColor('#999')
           .font('Helvetica')
           .text('Thank you for shopping with RushBasket!', 50, footerY, { 
               align: 'center',
               width: 500 
           })
           .text('For any queries, contact us at support@rushbasket.com', 50, footerY + 15, {
               align: 'center',
               width: 500
           });

        // Add page numbers if multiple pages
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(8)
               .fillColor('#999')
               .text(
                   `Page ${i + 1} of ${pages.count}`,
                   50,
                   doc.page.height - 30,
                   { align: 'center', width: 500 }
               );
        }

        // Finalize PDF
        doc.end();

        console.log(`✅ Invoice generated successfully for order: ${order.orderId}`);

    } catch (error) {
        console.error('❌ Generate invoice error:', error);
        console.error('Error stack:', error.stack);
        
        // Make sure response hasn't been sent yet
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Failed to generate invoice',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
            });
        }
    }
};

export default generateInvoice;