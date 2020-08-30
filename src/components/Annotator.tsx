import React, { useMemo, useState, useEffect, useCallback } from 'react';
import usePDF from '../hooks/usePDF';
import useAnnotations from '../hooks/useAnnotations';
import useTextMap from '../hooks/useTextMap';
import Page from './page/Page';
import Error from './error/Error';
import ButtonGroup from './fab/ButtonGroup';
import { Entity } from '../interfaces/entity';
import { Annotation } from '../interfaces/annotation';
import { TextLayer } from '../interfaces/textLayer';
import { Word } from '../interfaces/orc';
import './Annotator.scss';

interface Props {
  url?: string;
  data?: Uint8Array | BufferSource | string;
  textLayer?: Array<TextLayer>;
  httpHeaders?: {
    [key: string]: string;
  };
  initialScale?: number;
  tokenizer?: RegExp;
  disableOCR?: boolean;
  entity?: Entity;
  initialTextMap?: Array<TextLayer>;
  defaultAnnotations?: Array<Annotation>,
  getAnnotations?: (annotations: Array<Annotation>) => void;
  getTextMaps?: (textMaps: Array<TextLayer>) => void;
}

const Annotator = ({
  url,
  data,
  textLayer,
  httpHeaders,
  initialScale = 1.5,
  tokenizer = new RegExp(/\w+([,.\-/]\w+)+|\w+|\W/g),
  disableOCR = false,
  entity,
  initialTextMap,
  defaultAnnotations = [],
  getAnnotations,
  getTextMaps,
}: Props) => {
  const [scale, setScale] = useState(initialScale);

  const { pages, error, fetchPage } = usePDF({ url, data, httpHeaders });
  const {
    annotations,
    getAnnotationsForPage,
    addAnnotation,
    removeAnnotation
  } = useAnnotations(defaultAnnotations);
  const { textMap, addPageToTextMap } = useTextMap(annotations);

  useEffect(() => {
    if (getAnnotations) {
      getAnnotations(annotations);
    }
    if (getTextMaps) {
      getTextMaps(initialTextMap || textMap);
    }
  }, [annotations, textMap, initialTextMap, getAnnotations, getTextMaps]);

  const getTextLayerForPage = useCallback((page: number): Array<Word> | undefined => {
    if (textLayer) {
      const found = textLayer.find((layer) => layer.page === page);
      return found ? found.textMapItems : undefined;
    }
    return undefined;
  }, [textLayer]);

  const renderPages = useMemo(() => {
    if (!url && !data) {
      return (
        <Error
          message="You need to provide either valid PDF data or a URL to a PDF"
        />
      );
    }

    if (error) {
      return <Error />;
    }

    return (
      Array(pages).fill(0).map((_, index) => {
        const key = `pdf-page-${index}`;
        const pageNumber = index + 1;
        const page = fetchPage(pageNumber);
        return (
          <Page
            page={page}
            scale={scale}
            key={key}
            tokenizer={tokenizer}
            disableOCR={disableOCR}
            pageNumber={pageNumber}
            annotations={getAnnotationsForPage(pageNumber)}
            addAnnotation={addAnnotation}
            removeAnnotation={removeAnnotation}
            addTextMapPage={addPageToTextMap}
            entity={entity}
            initialTextLayer={getTextLayerForPage(index)}
          />
        );
      })
    );
  }, [
    url, data, pages, error, scale, tokenizer, disableOCR, entity,
    fetchPage, getAnnotationsForPage, addAnnotation, removeAnnotation, addPageToTextMap, getTextLayerForPage,
  ]);

  return (
    <div className="annotator-container">
      <div className="annotator-pages-container">
        <div className="annotator-pages">
          { renderPages }
        </div>
      </div>
      <ButtonGroup scale={scale} setScale={setScale} />
    </div>
  );
};

export default Annotator;
