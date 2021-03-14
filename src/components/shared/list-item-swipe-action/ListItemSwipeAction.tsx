import anime from "animejs";
import classNames from "classnames";
import * as React from "react";

import "./ListItemSwipeAction.scss";

interface ListItemSwipeActionProps {
  onAction?: () => void;
  className?: string;
  backContent?: React.ReactNode;
  frontContent?: React.ReactNode;
}

interface ListItemSwipeActionState {
  translateX: string;
  lastPosition: number;
  opacity: number;
  height: string;
}

function ListItemSwipeAction({
  className,
  frontContent,
  backContent,
  ...props
}: ListItemSwipeActionProps) {
  const [state, setState] = React.useState<ListItemSwipeActionState>({
    height: "auto",
    lastPosition: 0,
    opacity: 1,
    translateX: "0%",
  });

  const frontDiv = React.useRef<HTMLDivElement | null>(null);
  const mcFrontDiv = React.useRef<HammerManager | null>(null);
  const frontDivAnimation = React.useRef<anime.AnimeInstance | null>(null);

  React.useEffect(() => {
    function onPan(event: HammerInput) {
      const { translateX, lastPosition } = state;
      const { deltaX } = event;

      if (frontDivAnimation.current) {
        frontDivAnimation.current.pause();
        frontDivAnimation.current = null;
      }

      let frontPosition = lastPosition + deltaX;

      if (frontPosition < 0) {
        frontPosition = 0;
      }

      if (event.isFinal) {
        onFinal(frontPosition);
      } else {
        setState({
          ...state,
          translateX: `${frontPosition}px`,
        });
      }
    }

    function onFinal(currentPosition: number) {
      const swipableWidth = frontDiv.current!.getBoundingClientRect().width;
      const triggerDelete = currentPosition / swipableWidth > 0.25;
      const positionTarget = triggerDelete ? swipableWidth : 0;

      const animateObject = { position: currentPosition };
      frontDivAnimation.current = anime({
        complete: () => {
          if (triggerDelete) {
            onAction();
          }
        },
        duration: 250,
        easing: "linear",
        position: positionTarget,
        targets: animateObject,
        update: () => {
          setState({
            ...state,
            lastPosition: animateObject.position,
            translateX: `${animateObject.position}px`,
          });
        },
      });
    }

    function onAction() {
      const animateObject = {
        height: frontDiv.current!.clientHeight,
        opacity: 1,
      };

      anime({
        complete: () => {
          if (props.onAction) {
            props.onAction();
          }
        },
        duration: 250,
        easing: "linear",
        height: 0,
        opacity: 0,
        targets: animateObject,
        update: () => {
          setState({
            ...state,
            height: `${animateObject.height}px`,
            opacity: animateObject.opacity,
          });
        },
      });
    }

    mcFrontDiv.current = new Hammer(frontDiv.current!);

    mcFrontDiv.current
      .get("pan")
      .set({ direction: Hammer.DIRECTION_HORIZONTAL });
    mcFrontDiv.current.on("pan", onPan);
    return () => {
      mcFrontDiv.current?.destroy();
    };
  });

  const { translateX, opacity, height } = state;

  return (
    <div
      className={classNames("swipe-delete", className)}
      style={{ opacity, height }}
    >
      <div
        ref={(div) => (frontDiv.current = div)}
        className={classNames("swipe-delete__front")}
        style={{
          transform: `translateX(${translateX})`,
        }}
      >
        {frontContent}
      </div>

      <div className="swipe-delete__back">{backContent}</div>
    </div>
  );
}

export default ListItemSwipeAction;
