AFRAME.registerComponent("gesture-detector", {
  schema: { element: { default: "" } },

  init: function () {
    this.targetElement = this.data.element
      ? document.querySelector(this.data.element)
      : this.el;

    this.internalState = { previousState: null };

    this.emitGestureEvent = this.emitGestureEvent.bind(this);

    this.targetElement.addEventListener("touchstart", this.emitGestureEvent);
    this.targetElement.addEventListener("touchend", this.emitGestureEvent);
    this.targetElement.addEventListener("touchmove", this.emitGestureEvent);
  },

  remove: function () {
    this.targetElement.removeEventListener("touchstart", this.emitGestureEvent);
    this.targetElement.removeEventListener("touchend", this.emitGestureEvent);
    this.targetElement.removeEventListener("touchmove", this.emitGestureEvent);
  },

  emitGestureEvent(event) {
    const currentState = this.getTouchState(event);
    const previousState = this.internalState.previousState;

    const gestureContinues =
      previousState && currentState && currentState.touchCount === previousState.touchCount;

    if (gestureContinues) {
      const eventDetail = {
        positionChange: {
          x: currentState.position.x - previousState.position.x,
          y: currentState.position.y - previousState.position.y,
        },
      };

      if (currentState.spread) {
        eventDetail.spreadChange = currentState.spread - previousState.spread;
      }

      Object.assign(previousState, currentState);
      Object.assign(eventDetail, previousState);

      const eventName = `${this.getEventPrefix(currentState.touchCount)}fingermove`;
      this.el.emit(eventName, eventDetail);
    }

    this.internalState.previousState = currentState;
  },

  getTouchState: function (event) {
    if (event.touches.length === 0) return null;

    const touchList = Array.from(event.touches);
    const centerX = touchList.reduce((sum, touch) => sum + touch.clientX, 0) / touchList.length;
    const centerY = touchList.reduce((sum, touch) => sum + touch.clientY, 0) / touchList.length;

    const screenScale = 2 / (window.innerWidth + window.innerHeight);

    const touchState = {
      touchCount: touchList.length,
      position: { x: centerX * screenScale, y: centerY * screenScale },
    };

    if (touchList.length >= 2) {
      const spread =
        touchList.reduce((sum, touch) => {
          return (
            sum +
            Math.sqrt(Math.pow(centerX - touch.clientX, 2) + Math.pow(centerY - touch.clientY, 2))
          );
        }, 0) / touchList.length;

      touchState.spread = spread * screenScale;
    }

    return touchState;
  },

  getEventPrefix: function (touchCount) {
    const numberNames = ["one", "two", "three", "many"];
    return numberNames[Math.min(touchCount, 4) - 1];
  },
});
