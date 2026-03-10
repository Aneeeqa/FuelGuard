import { useState } from 'react';
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  Copy,
  Download,
  X,
  FilePdf
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import './ExportDialog.css';

/**
 * Export Dialog Component
 *
 * Provides export options for tank-to-tank trip data including:
 * - PDF export (single trip or all trips)
 * - Excel export (single trip or all trips)
 * - Text report (copy to clipboard)
 *
 * Time Complexity: O(1) - Static component rendering
 * Space Complexity: O(1) - No additional data structures
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether dialog is open
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Object} props.tripData - Tank-to-Tank calculation result
 * @param {Array} props.allTrips - Array of all tank-to-tank trips
 * @param {boolean} props.showAllTripsOption - Show "Export All Trips" option
 * @param {Function} props.onExportToPDF - Callback for PDF export
 * @param {Function} props.onExportToExcel - Callback for Excel export
 * @param {Function} props.onCopyReport - Callback for copying report
 * @param {boolean} props.isExporting - Whether export is in progress
 */
const ExportDialog = ({
  isOpen,
  onClose,
  tripData,
  allTrips,
  showAllTripsOption = false,
  onExportToPDF,
  onExportToExcel,
  onCopyReport,
  isExporting = false,
}) => {
  const [exportOption, setExportOption] = useState('pdf');

  // Handle export
  const handleExport = () => {
    if (isExporting) return;

    switch (exportOption) {
      case 'pdf':
        onExportToPDF?.(tripData);
        break;
      case 'excel':
        onExportToExcel?.(tripData);
        break;
      case 'copy':
        onCopyReport?.(tripData);
        break;
      default:
        break;
    }
  };

  // Handle export all trips
  const handleExportAll = () => {
    if (isExporting || !onExportToExcel) return;

    onExportToExcel(allTrips);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Report"
      className="export-dialog"
    >
      <Modal.Body>
        <div className="export-options">
          <h3 className="export-title">Select Export Format</h3>
          <p className="export-description">
            Choose a format to export your tank-to-tank analysis report
          </p>

          <div className="export-buttons">
            {/* PDF Option */}
            <button
              className={`export-option ${exportOption === 'pdf' ? 'active' : ''}`}
              onClick={() => setExportOption('pdf')}
              disabled={isExporting}
            >
              <FilePdf size={32} className="export-icon" />
              <div className="export-option-content">
                <div className="export-option-title">PDF Report</div>
                <div className="export-option-description">
                  Professional formatted report with charts and tables
                </div>
              </div>
              {exportOption === 'pdf' && (
                <div className="export-option-check">
                  <Download size={20} />
                </div>
              )}
            </button>

            {/* Excel Option */}
            <button
              className={`export-option ${exportOption === 'excel' ? 'active' : ''}`}
              onClick={() => setExportOption('excel')}
              disabled={isExporting}
            >
              <FileSpreadsheet size={32} className="export-icon" />
              <div className="export-option-content">
                <div className="export-option-title">Excel Spreadsheet</div>
                <div className="export-option-description">
                  Data in XLSX format with multiple sheets
                </div>
              </div>
              {exportOption === 'excel' && (
                <div className="export-option-check">
                  <Download size={20} />
                </div>
              )}
            </button>

            {/* Copy Option */}
            <button
              className={`export-option ${exportOption === 'copy' ? 'active' : ''}`}
              onClick={() => setExportOption('copy')}
              disabled={isExporting}
            >
              <Copy size={32} className="export-icon" />
              <div className="export-option-content">
                <div className="export-option-title">Copy to Clipboard</div>
                <div className="export-option-description">
                  Text report ready to paste anywhere
                </div>
              </div>
              {exportOption === 'copy' && (
                <div className="export-option-check">
                  <Copy size={20} />
                </div>
              )}
            </button>
          </div>

          {/* Export All Trips Option */}
          {showAllTripsOption && allTrips && allTrips.length > 1 && (
            <div className="export-all-section">
              <div className="export-all-divider"></div>
              <h4 className="export-all-title">Export All Trips</h4>
              <p className="export-all-description">
                Export all {allTrips.length} tank-to-tank trips as a complete report
              </p>
              <Button
                variant="outline"
                size="default"
                fullWidth={true}
                onClick={handleExportAll}
                disabled={isExporting}
                icon={FileSpreadsheet}
              >
                Export All Trips to Excel
              </Button>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div className="export-dialog-actions">
          <Button
            variant="secondary"
            size="default"
            onClick={onClose}
            disabled={isExporting}
            icon={X}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="default"
            onClick={handleExport}
            disabled={isExporting}
            icon={exportOption === 'copy' ? Copy : FileDown}
          >
            {isExporting ? 'Exporting...' : (
              <>
                {exportOption === 'pdf' && 'Export to PDF'}
                {exportOption === 'excel' && 'Export to Excel'}
                {exportOption === 'copy' && 'Copy Report'}
              </>
            )}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ExportDialog;
