// backend/routes/reports.js
import express from "express";
import PDFDocument from "pdfkit";
import { pool } from "../utils/db.js";

const router = express.Router();

// Helper function to fetch all data (alerts, simulations, protections, analytics)
async function fetchFullReportData() {
  try {
    // 1. Fetch alerts
    const alertsQuery = `
      SELECT id, tx_hash, "from", "to", risk_level, confidence, rules, 
             est_loss_usd, slippage_pct, payload, created_at
      FROM alerts
      ORDER BY created_at DESC
      LIMIT 500;
    `;
    const alertsResult = await pool.query(alertsQuery);
    const alerts = alertsResult.rows;

    // 2. Fetch simulations from events_log
    const simulationsQuery = `
      SELECT id, tx_hash, event_type, status, loss_usd, profit_usd, 
             slippage, gas_used, timestamp, risk_level
      FROM events_log
      WHERE event_type = 'simulation'
      ORDER BY timestamp DESC
      LIMIT 500;
    `;
    const simulationsResult = await pool.query(simulationsQuery);
    const simulations = simulationsResult.rows;

    // 3. Fetch protections from events_log
    const protectionsQuery = `
      SELECT id, tx_hash, event_type, status, loss_usd, profit_usd, 
             gas_used, timestamp, risk_level
      FROM events_log
      WHERE event_type = 'protection'
      ORDER BY timestamp DESC
      LIMIT 500;
    `;
    const protectionsResult = await pool.query(protectionsQuery);
    const protections = protectionsResult.rows;

    // 4. Fetch audit logs
    const auditLogsQuery = `
      SELECT id, event_type, related_tx_hash, meta, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 500;
    `;
    const auditLogsResult = await pool.query(auditLogsQuery);
    const auditLogs = auditLogsResult.rows;

    // 5. Fetch analytics summary
    const analyticsQuery = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_type = 'simulation' THEN 1 END) as total_simulations,
        COUNT(CASE WHEN event_type = 'protection' THEN 1 END) as total_protections,
        COUNT(CASE WHEN risk_level = 'HIGH' THEN 1 END) as high_risk_count,
        COUNT(CASE WHEN risk_level = 'MEDIUM' THEN 1 END) as medium_risk_count,
        COUNT(CASE WHEN risk_level = 'LOW' THEN 1 END) as low_risk_count,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
        COUNT(CASE WHEN status = 'failed' OR status = 'reverted' THEN 1 END) as failed_count,
        SUM(loss_usd) as total_loss,
        SUM(profit_usd) as total_profit,
        AVG(loss_usd) as avg_loss,
        AVG(profit_usd) as avg_profit,
        AVG(slippage) as avg_slippage,
        AVG(gas_used) as avg_gas
      FROM events_log;
    `;
    const analyticsResult = await pool.query(analyticsQuery);
    const analyticsRaw = analyticsResult.rows[0] || {};

    // 5. Fetch protection rate
    const protectionRateQuery = `
      SELECT 
        COUNT(CASE WHEN status = 'success' THEN 1 END) as protected,
        COUNT(CASE WHEN status != 'success' THEN 1 END) as failed
      FROM events_log
      WHERE event_type = 'protection';
    `;
    const protectionRateResult = await pool.query(protectionRateQuery);
    const protectionRate = protectionRateResult.rows[0] || { protected: 0, failed: 0 };

    // Format analytics data
    const analytics = {
      totalEvents: parseInt(analyticsRaw.total_events || 0),
      totalSimulations: parseInt(analyticsRaw.total_simulations || 0),
      totalProtections: parseInt(analyticsRaw.total_protections || 0),
      riskLevels: {
        high: parseInt(analyticsRaw.high_risk_count || 0),
        medium: parseInt(analyticsRaw.medium_risk_count || 0),
        low: parseInt(analyticsRaw.low_risk_count || 0)
      },
      executionStatus: {
        success: parseInt(analyticsRaw.success_count || 0),
        failed: parseInt(analyticsRaw.failed_count || 0)
      },
      financials: {
        totalLoss: parseFloat(analyticsRaw.total_loss || 0).toFixed(2),
        totalProfit: parseFloat(analyticsRaw.total_profit || 0).toFixed(2),
        avgLoss: parseFloat(analyticsRaw.avg_loss || 0).toFixed(2),
        avgProfit: parseFloat(analyticsRaw.avg_profit || 0).toFixed(2),
        avgSlippage: parseFloat(analyticsRaw.avg_slippage || 0).toFixed(2)
      },
      performance: {
        avgGas: parseInt(analyticsRaw.avg_gas || 0)
      },
      protectionRate: {
        protected: parseInt(protectionRate.protected || 0),
        failed: parseInt(protectionRate.failed || 0),
        successRate: protectionRate.protected > 0 
          ? ((protectionRate.protected / (parseInt(protectionRate.protected) + parseInt(protectionRate.failed))) * 100).toFixed(2)
          : "0.00"
      }
    };

    return {
      alerts,
      simulations,
      protections,
      auditLogs,
      analytics,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error("❌ Error fetching report data:", error.message);
    throw error;
  }
}

// GET /v1/reports/full - Returns full report as JSON
router.get("/full", async (req, res) => {
  try {
    console.log("📊 Generating full report (JSON)...");
    const reportData = await fetchFullReportData();
    
    res.json({
      ok: true,
      report: reportData
    });

    console.log("✅ Full report JSON generated successfully");
  } catch (error) {
    console.error("❌ Full report generation error:", error.message);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// GET /v1/reports/full/pdf - Returns full report as PDF
router.get("/full/pdf", async (req, res) => {
  try {
    console.log("📄 Generating full report (PDF)...");
    const reportData = await fetchFullReportData();

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Protego-Full-Report.pdf");

    // Pipe PDF to response
    doc.pipe(res);

    // Helper functions for PDF styling
    const addHeader = (text) => {
      doc.fontSize(20).text(text, { underline: true });
      doc.moveDown();
    };

    const addSubHeader = (text) => {
      doc.fontSize(14).text(text);
      doc.moveDown(0.5);
    };

    const addText = (label, value) => {
      doc.fontSize(10).text(label + ': ' + value);
    };

    const addSeparator = () => {
      doc.moveDown();
      doc.strokeColor('#cccccc').lineWidth(1)
         .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
    };

    // Title Page
    doc.fontSize(28).text('PROTEGO', { align: 'center' });
    doc.fontSize(18).text('Full Security Report', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(12).text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, { align: 'center' });
    doc.moveDown(3);

    // ==================== ANALYTICS SUMMARY ====================
    addHeader('📊 ANALYTICS SUMMARY');

    addSubHeader('Overview');
    addText('Total Events', reportData.analytics.totalEvents.toString());
    addText('Total Simulations', reportData.analytics.totalSimulations.toString());
    addText('Total Protections', reportData.analytics.totalProtections.toString());
    doc.moveDown();

    addSubHeader('Risk Distribution');
    addText('High Risk', reportData.analytics.riskLevels.high.toString());
    addText('Medium Risk', reportData.analytics.riskLevels.medium.toString());
    addText('Low Risk', reportData.analytics.riskLevels.low.toString());
    doc.moveDown();

    addSubHeader('Execution Status');
    addText('Successful', reportData.analytics.executionStatus.success.toString());
    addText('Failed/Reverted', reportData.analytics.executionStatus.failed.toString());
    doc.moveDown();

    addSubHeader('Financial Metrics');
    addText('Total Loss (USD)', '$' + reportData.analytics.financials.totalLoss);
    addText('Total Profit (USD)', '$' + reportData.analytics.financials.totalProfit);
    addText('Average Loss (USD)', '$' + reportData.analytics.financials.avgLoss);
    addText('Average Profit (USD)', '$' + reportData.analytics.financials.avgProfit);
    addText('Average Slippage (%)', reportData.analytics.financials.avgSlippage + '%');
    doc.moveDown();

    addSubHeader('Protection Rate');
    addText('Protected Transactions', reportData.analytics.protectionRate.protected.toString());
    addText('Failed Protections', reportData.analytics.protectionRate.failed.toString());
    addText('Success Rate', reportData.analytics.protectionRate.successRate + '%');
    doc.moveDown();

    addSubHeader('Performance');
    addText('Average Gas Used', reportData.analytics.performance.avgGas.toString());
    
    addSeparator();

    // ==================== ALERTS ====================
    doc.addPage();
    addHeader('🚨 ALERTS');
    addText('Total Alerts', reportData.alerts.length.toString());
    doc.moveDown();

    reportData.alerts.slice(0, 20).forEach((alert, index) => {
      if (doc.y > 700) doc.addPage();
      
      addSubHeader(`Alert #${index + 1}`);
      addText('Transaction Hash', alert.tx_hash?.slice(0, 20) + '...' || 'N/A');
      addText('From', alert.from?.slice(0, 20) + '...' || 'N/A');
      addText('To', alert.to?.slice(0, 20) + '...' || 'N/A');
      addText('Risk Level', alert.risk_level || 'N/A');
      addText('Confidence', alert.confidence + '%');
      addText('Est. Loss (USD)', '$' + (alert.est_loss_usd || '0.00'));
      addText('Slippage', (alert.slippage_pct || '0.00') + '%');
      addText('Created At', new Date(alert.created_at).toLocaleString());
      doc.moveDown();
    });

    if (reportData.alerts.length > 20) {
      doc.fontSize(10).text(`... and ${reportData.alerts.length - 20} more alerts. View full data in JSON format.`);
    }

    addSeparator();

    // ==================== SIMULATIONS ====================
    doc.addPage();
    addHeader('🔬 SIMULATIONS');
    addText('Total Simulations', reportData.simulations.length.toString());
    doc.moveDown();

    reportData.simulations.slice(0, 15).forEach((sim, index) => {
      if (doc.y > 700) doc.addPage();
      
      addSubHeader(`Simulation #${index + 1}`);
      addText('Transaction Hash', sim.tx_hash?.slice(0, 20) + '...' || 'N/A');
      addText('Status', sim.status || 'N/A');
      addText('Loss (USD)', '$' + (sim.loss_usd || '0.00'));
      addText('Profit (USD)', '$' + (sim.profit_usd || '0.00'));
      addText('Slippage', (sim.slippage || '0.00') + '%');
      addText('Gas Used', sim.gas_used || 'N/A');
      addText('Timestamp', new Date(sim.timestamp).toLocaleString());
      doc.moveDown();
    });

    if (reportData.simulations.length > 15) {
      doc.fontSize(10).text(`... and ${reportData.simulations.length - 15} more simulations. View full data in JSON format.`);
    }

    addSeparator();

    // ==================== PROTECTIONS ====================
    doc.addPage();
    addHeader('🛡️ PROTECTIONS');
    addText('Total Protections', reportData.protections.length.toString());
    doc.moveDown();

    reportData.protections.slice(0, 15).forEach((prot, index) => {
      if (doc.y > 700) doc.addPage();
      
      addSubHeader(`Protection #${index + 1}`);
      addText('Transaction Hash', prot.tx_hash?.slice(0, 20) + '...' || 'N/A');
      addText('Status', prot.status || 'N/A');
      addText('Loss Prevented (USD)', '$' + (prot.loss_usd || '0.00'));
      addText('Gas Used', prot.gas_used || 'N/A');
      addText('Timestamp', new Date(prot.timestamp).toLocaleString());
      doc.moveDown();
    });

    if (reportData.protections.length > 15) {
      doc.fontSize(10).text(`... and ${reportData.protections.length - 15} more protections. View full data in JSON format.`);
    }

    addSeparator();

    // ==================== AUDIT LOGS ====================
    doc.addPage();
    addHeader('📋 AUDIT LOGS');
    addText('Total Audit Logs', reportData.auditLogs.length.toString());
    doc.moveDown();

    reportData.auditLogs.slice(0, 20).forEach((log, index) => {
      if (doc.y > 700) doc.addPage();
      
      addSubHeader(`Audit Log #${index + 1}`);
      addText('Event Type', log.event_type || 'N/A');
      addText('Related TX Hash', log.related_tx_hash?.slice(0, 20) + '...' || 'N/A');
      addText('Created At', new Date(log.created_at).toLocaleString());
      if (log.meta && Object.keys(log.meta).length > 0) {
        doc.fontSize(9).text('Metadata: ' + JSON.stringify(log.meta).slice(0, 100) + '...');
      }
      doc.moveDown();
    });

    if (reportData.auditLogs.length > 20) {
      doc.fontSize(10).text(`... and ${reportData.auditLogs.length - 20} more audit logs. View full data in JSON format.`);
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).text('End of Report', { align: 'center' });
    doc.fontSize(8).text('Generated by Protego Security System', { align: 'center' });

    // Finalize PDF
    doc.end();

    console.log("✅ Full report PDF generated successfully");

  } catch (error) {
    console.error("❌ PDF generation error:", error.message);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

export default router;
