import React, { useCallback } from "react";

import { bodyFront } from "./assets/bodyFront";
import { bodyBack } from "./assets/bodyBack";
import { SvgMaleWrapper } from "./SvgMaleWrapper";

/**
 * Simplificado a solo modelo masculino: GymPro no registra el género del
 * socio todavía, así que el modelo femenino (y SvgFemaleWrapper) no se
 * vendorizó. Si se agrega un campo de género al perfil, el componente
 * original sí lo soporta — ver NOTICE.md.
 */
const Body = ({
  colors = ["#0984e3", "#74b9ff"],
  data,
  scale = 1,
  side = "front",
  onBodyPartPress,
  border = "#dfdfdf",
  disabledParts = [],
  hiddenParts = [],
  defaultFill = "#3f3f3f",
  defaultStroke = "none",
  defaultStrokeWidth = 0,
}) => {
  const getPartStyles = useCallback(
    (bodyPart) => ({
      fill: bodyPart.styles?.fill ?? defaultFill,
      stroke: bodyPart.styles?.stroke ?? defaultStroke,
      strokeWidth: bodyPart.styles?.strokeWidth ?? defaultStrokeWidth,
    }),
    [defaultFill, defaultStroke, defaultStrokeWidth]
  );

  const mergedBodyParts = useCallback(
    (dataSource) => {
      const filteredDataSource = dataSource.filter(
        (part) => !hiddenParts.includes(part.slug)
      );

      const userDataMap = new Map();
      data.forEach((userPart) => {
        if (userPart.slug) {
          userDataMap.set(userPart.slug, userPart);
        }
      });

      return filteredDataSource.map((assetPart) => {
        const userPart = userDataMap.get(assetPart.slug);

        if (!userPart) {
          return assetPart;
        }

        const merged = {
          ...assetPart,
          styles: userPart.styles,
          intensity: userPart.intensity,
          side: userPart.side,
          color: userPart.color,
        };

        if (!merged.styles?.fill && !merged.color && merged.intensity) {
          merged.color = colors[merged.intensity - 1];
        }

        return merged;
      });
    },
    [data, colors, hiddenParts]
  );

  const getColorToFill = (bodyPart) => {
    if (bodyPart.slug && disabledParts.includes(bodyPart.slug)) {
      return "#EBEBE4";
    }

    // Prioridad: styles.fill por pieza > color > color por intensidad > default
    if (bodyPart.styles?.fill) {
      return bodyPart.styles.fill;
    }

    if (bodyPart.color) {
      return bodyPart.color;
    }

    if (bodyPart.intensity && bodyPart.intensity > 0) {
      return colors[bodyPart.intensity - 1];
    }

    return undefined;
  };

  const isPartDisabled = (slug) => slug && disabledParts.includes(slug);

  const renderBodySvg = (bodyToRender) => {
    return (
      <SvgMaleWrapper side={side} scale={scale} border={border}>
        {mergedBodyParts(bodyToRender).map((bodyPart) => {
          const commonPaths = (bodyPart.path?.common || []).map((path, index) => {
            const partStyles = getPartStyles(bodyPart);
            const fillColor = getColorToFill(bodyPart);

            return (
              <path
                key={`${bodyPart.slug}-common-${index}`}
                onClick={
                  isPartDisabled(bodyPart.slug)
                    ? undefined
                    : () => onBodyPartPress?.(bodyPart)
                }
                style={{
                  cursor: isPartDisabled(bodyPart.slug) ? "not-allowed" : "pointer",
                  opacity: isPartDisabled(bodyPart.slug) ? 0.6 : 1,
                }}
                aria-disabled={isPartDisabled(bodyPart.slug)}
                id={bodyPart.slug}
                fill={fillColor ?? partStyles.fill}
                stroke={partStyles.stroke}
                strokeWidth={partStyles.strokeWidth}
                d={path}
              />
            );
          });

          const leftPaths = (bodyPart.path?.left || []).map((path, index) => {
            const isOnlyRight =
              data.find((d) => d.slug === bodyPart.slug)?.side === "right";
            const partStyles = getPartStyles(bodyPart);
            const fillColor = isOnlyRight ? defaultFill : getColorToFill(bodyPart);

            return (
              <path
                key={`${bodyPart.slug}-left-${index}`}
                onClick={
                  isPartDisabled(bodyPart.slug)
                    ? undefined
                    : () => onBodyPartPress?.(bodyPart, "left")
                }
                style={{
                  cursor: isPartDisabled(bodyPart.slug) ? "not-allowed" : "pointer",
                  opacity: isPartDisabled(bodyPart.slug) ? 0.6 : 1,
                }}
                id={bodyPart.slug}
                fill={fillColor ?? partStyles.fill}
                stroke={partStyles.stroke}
                strokeWidth={partStyles.strokeWidth}
                d={path}
              />
            );
          });

          const rightPaths = (bodyPart.path?.right || []).map((path, index) => {
            const isOnlyLeft =
              data.find((d) => d.slug === bodyPart.slug)?.side === "left";
            const partStyles = getPartStyles(bodyPart);
            const fillColor = isOnlyLeft ? defaultFill : getColorToFill(bodyPart);

            return (
              <path
                key={`${bodyPart.slug}-right-${index}`}
                onClick={
                  isPartDisabled(bodyPart.slug)
                    ? undefined
                    : () => onBodyPartPress?.(bodyPart, "right")
                }
                style={{
                  cursor: isPartDisabled(bodyPart.slug) ? "not-allowed" : "pointer",
                  opacity: isPartDisabled(bodyPart.slug) ? 0.6 : 1,
                }}
                id={bodyPart.slug}
                fill={fillColor ?? partStyles.fill}
                stroke={partStyles.stroke}
                strokeWidth={partStyles.strokeWidth}
                d={path}
              />
            );
          });

          return [...commonPaths, ...leftPaths, ...rightPaths];
        })}
      </SvgMaleWrapper>
    );
  };

  const bodyToRender = side === "front" ? bodyFront : bodyBack;

  return renderBodySvg(bodyToRender);
};

export default Body;
