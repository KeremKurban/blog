# LangGraph topology diagram

`langgraph-topology.svg` in the post is generated from the post's own graph code, not drawn by hand.

1. `python make_graph.py > graph.mmd` builds the graph with stub nodes and exports it with LangGraph's
   `graph.get_graph().draw_mermaid()`.
2. `langgraph-topology.mmd` is that export with nodes and edges reordered so edge labels sit far apart
   (the most-separated of all 48 edge orderings), `<p>` and `&nbsp;` HTML stripped for plain SVG text, and curves set to `basis`.
   The graph itself is unchanged.
3. Render with mermaid-cli in the blog palette:

   ```sh
   npx @mermaid-js/mermaid-cli@11.4.2 -i langgraph-topology.mmd -o ../../public/posts/regulated-agent-platform/langgraph-topology.svg -c mermaid.json -b "#f5f3ec"
   ```

   Then replace the SVG's `width="100%"` with its viewBox width and height so it renders at natural size.
