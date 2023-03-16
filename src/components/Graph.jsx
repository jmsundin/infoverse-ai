import React, { useEffect, useRef } from "react";
import isEqual from "lodash/isEqual";
import differenceWith from "lodash/differenceWith";
import { DataSet } from "vis-data/peer/esm/vis-data";
import { Network } from "vis-network/peer/esm/vis-network";
import PropTypes from "prop-types";

import "vis-network/styles/vis-network.css";

import { transformDataForVisNetwork } from "../utils/transformData";

Graph.propTypes = {
  data: PropTypes.object,
  options: PropTypes.object,
  es: PropTypes.object,
  style: PropTypes.object,
  getNetwork: PropTypes.func,
  getNodes: PropTypes.func,
  getEdges: PropTypes.func,
};

function Graph({
  data, 
  options, 
  es,
  style = {},
  getNetwork,
  getNodes,
  getEdges,
}) {

  // data = transformDataForVisNetwork(data);
  
  style = { width: "100%", height: "100%" };

  let nodes = useRef(new DataSet(data.nodes));
  let edges = useRef(new DataSet(data.edges));

  const network = useRef(null);
  const container = useRef(null);

  useEffect(() => {
    network.current = new Network(
      container.current,
      { nodes: nodes.current, edges: edges.current },
      options
    );

    if (getNetwork) {
      getNetwork(network.current);
    }

    if (getNodes) {
      getNodes(nodes.current);
    }

    if (getEdges) {
      getEdges(edges.current);
    }
  }, []);

  useEffect(() => {
    const nodesChange = !isEqual(nodes.current, data.nodes);
    const edgesChange = !isEqual(edges.current, data.edges);

    if (nodesChange) {
      const idIsEqual = (n1, n2) => n1.id === n2.id;
      const nodesRemoved = differenceWith(
        nodes.current.get(),
        data.nodes,
        idIsEqual
      );
      const nodesAdded = differenceWith(
        data.nodes,
        nodes.current.get(),
        idIsEqual
      );
      const nodesChanged = differenceWith(
        differenceWith(data.nodes, nodes.current.get(), isEqual),
        nodesAdded
      );

      nodes.current.remove(nodesRemoved);
      nodes.current.add(nodesAdded);
      nodes.current.update(nodesChanged);
    }

    if (edgesChange) {
      const edgesRemoved = differenceWith(
        edges.current.get(),
        data.edges,
        isEqual
      );
      const edgesAdded = differenceWith(
        data.edges,
        edges.current.get(),
        isEqual
      );
      const edgesChanged = differenceWith(
        differenceWith(data.edges, edges.current.get(), isEqual),
        edgesAdded
      );
      edges.current.remove(edgesRemoved);
      edges.current.add(edgesAdded);
      edges.current.update(edgesChanged);
    }

    if ((nodesChange || edgesChange) && getNetwork) {
      getNetwork(network.current);
    }

    if (nodesChange && getNodes) {
      getNodes(nodes.current);
    }

    if (edgesChange && getEdges) {
      getEdges(edges.current);
    }
  }, [data]);

  useEffect(() => {
    network.current.setOptions(options);
  }, [options]);

  useEffect(() => {
    // Add user provied es to network
    // eslint-disable-next-line no-restricted-syntax
    for (const eName of Object.keys(es)) {
      network.current.on(eName, es[eName]);
    }

    return () => {
      for (const eName of Object.keys(es)) {
        network.current.off(eName, es[eName]);
      }
    };
  }, [es]);

  return <div ref={container} style={style} />;
}

export default Graph;
