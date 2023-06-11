# KASA Bridge


# KASA Devices
## Color:

- Must set color_temp to 0, or hue/saturation won't take effect.
- E.g.: http://192.168.1.183:3000/kasa/setLightState?ch=1&on_off=1&color_temp=0&brightness=100&hue=100&saturation=100&transition=500

## White:
- http://192.168.1.183:3000/kasa/setLightState?ch=1&on_off=1&color_temp=4000&brightness=100