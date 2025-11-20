import React from "react"

function ChartModal({ open, onClose, children }) {
if (!open) return null

return (
<div className="chart-modal-overlay" onClick={onClose} >
<div
className="chart-modal-content"
onClick={(e) => e.stopPropagation()}
>
<button className="chart-modal-close" onClick={onClose}>
Close
</button>

    <div className="chart-modal-inner">
      {children}
    </div>
  </div>
</div>


)
}

export default ChartModal