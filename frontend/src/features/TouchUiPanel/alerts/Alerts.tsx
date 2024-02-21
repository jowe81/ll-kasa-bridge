import "./alerts.scss";

function Alerts({alerts}) {
    if (!alerts) {
        return;
    }

    const alertsJsx = alerts.sort((a, b) => a.issued_at > b.issued_at ? -1 : 1).map((alert: any, index) => {
        let levelText, badgeClass;

        switch (alert.level) {
            case "warn":
                levelText = "Warning";
                badgeClass = "badge-orange badge-border-orange";
                break;

            case "alert":
                levelText = "Alarm";
                badgeClass = "badge-red badge-border-red";
                break;

            case "critical":
                levelText = "Critical";
                badgeClass = "badge-red";
                break;
        }
        
        return (
            <div className={`alert-container ${badgeClass}`} key={index}>
                <div className={`alert-header-container`}>
                    <div>{alert.serviceLabel}</div>
                    <div>
                        Issued at{" "}
                        {new Date(alert.issued_at).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                            hourCycle: "h23",
                        })}
                    </div>
                </div>
                <div className="alert-message">{alert.message}</div>
            </div>
        );
    });

    return (
        <div className="touch-ui-panel-item">
            <div className="alerts-compact-container">
                <div className="alerts-label">{alerts.length} Alert{alerts.length === 1 ? '' : 's'}</div>
                <div className="alerts-compact-items-container">{alertsJsx}</div>
            </div>
        </div>
    );
}

export default Alerts;
