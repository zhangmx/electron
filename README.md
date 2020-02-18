# balena-electronjs

This is work in progress

## What

Provides stuff that may be missing when running electron apps in kiosk mode
(with no desktop environment):
 * a wifi configuration dialog
 * a file picker
 * an on-screen keyboard (onboard)
 * a dialog for mounting / umounting removable drives

## How

 * Build this project's docker image `docker build -t bejs .`;
 * In your electron app project create a Dockerfile that uses the image you
   built above: `FROM bejs`;
 * Put your electron app in `/usr/src/app` in this Dockerfile.

This works by running a window manager (`metacity` for now), `dbus`, an
on-screen keyboard (`onboard`) and requiring some js code before your
application.

The required js code replaces the file picker, adds buttons for opening the
additional dialogs and injects some javascript in each window to summon the
on-screen keyboard when an input is focused.

## Components

### Wifi configuration

Works by communicating with NetworkManager via DBus.

### File picker

Replaces the default electron gtk file picker, can be constrained with
`BALENA_ELECTRONJS_CONSTRAINT_PATH`.

### On-screen keyboard

`onboard` is summoned via the session dbus each time an input is focused.

### Mounting / umounting of removable drives

Watches and allows to mount / umount removable drives in
`BALENA_ELECTRONJS_MOUNTS_ROOT`.

## Environment variables:

| Name | Description | Default Value |
| ---- | ----------- | ------------- |
| `BALENA_ELECTRONJS_MOUNTS_ROOT` | Where the removable drives should be mounted| `/tmp/media` |
| `BALENA_ELECTRONJS_CONSTRAINT_PATH` | Only files in this path will be accessible through the file picker |  |
| `DBUS_SYSTEM_BUS_ADDRESS` | DBus address for communicating with NetworkManager | `unix:path=/host/run/dbus/system_bus_socket` |
| `USE_XVFB` | Use `Xvfb` instead of `startx` if non empty |  |
| `XVFB_RESOLUTION` | `Xvfb` resolution and color depth (only useful if `USE_XVFB` is set) | `1366x768x24` |
| `VNC_PASSWORD` | Vnc password, will start x11vnc if non empty |  |
| `XRANDR_ROTATION` | Rotate the screen with `xrandr -o $XRANDR_ROTATION` |  |