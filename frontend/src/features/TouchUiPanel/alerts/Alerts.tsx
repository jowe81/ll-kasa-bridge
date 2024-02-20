import "./alerts.scss";

function Alerts({alerts}) {
    if (!alerts) {
        return;
    }

    const alertsJsx = alerts.map((alert: any, index) => {
        let levelText, badgeClass;

        switch (alert.level) {
            case "warn":
                levelText = "Warning";
                badgeClass = "badge-orange";
                break;

            case "alert":
                levelText = "Alarm";
                badgeClass = "badge-red";
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
                        Issued at
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
                <div className="alerts-label">Alerts</div>
                <div className="alerts-compact-items-container">{alertsJsx}</div>
            </div>
        </div>
    );
}

export default Alerts;
