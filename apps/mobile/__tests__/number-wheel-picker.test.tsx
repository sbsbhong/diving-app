import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ITEM_HEIGHT, NumberWheelPicker } from '../src/components/ui/number-wheel-picker';

const renderers: ReactTestRenderer.ReactTestRenderer[] = [];

afterEach(async () => {
  await ReactTestRenderer.act(async () => {
    for (const renderer of renderers.splice(0)) {
      renderer.unmount();
    }
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });
});

describe('NumberWheelPicker', () => {
  it('renders a vertical snapping wheel from min to max using step', async () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NumberWheelPicker value={10} min={0} max={20} step={5} unitLabel="m" onChange={onChange} testID="depth-picker" />,
      );
    });
    renderers.push(renderer!);

    const list = renderer!.root.findByProps({ testID: 'depth-picker-wheel-list' });

    expect(React.Children.count(list.props.children)).toBe(5);
    expect(list.props.snapToInterval).toBe(ITEM_HEIGHT);
    expect(list.props.scrollEventThrottle).toBe(16);
    expect(list.props.showsVerticalScrollIndicator).toBe(false);
    expect(renderer!.root.findByProps({ testID: 'depth-picker-value' }).props.children).toBe('10');
    expect(renderer!.root.findByProps({ testID: 'depth-picker-unit' }).props.children).toBe('m');
  });

  it('selects the nearest value when momentum scrolling ends', async () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NumberWheelPicker value={10} min={0} max={20} step={5} unitLabel="m" onChange={onChange} testID="depth-picker" />,
      );
    });
    renderers.push(renderer!);

    const list = renderer!.root.findByProps({ testID: 'depth-picker-wheel-list' });

    await ReactTestRenderer.act(async () => {
      list.props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { y: ITEM_HEIGHT * 3.2 } } });
    });

    expect(onChange).toHaveBeenCalledWith(15);
  });

  it('updates the centered value while the wheel is scrolling', async () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NumberWheelPicker value={10} min={0} max={20} step={5} unitLabel="m" onChange={onChange} testID="depth-picker" />,
      );
    });
    renderers.push(renderer!);

    const list = renderer!.root.findByProps({ testID: 'depth-picker-wheel-list' });

    await ReactTestRenderer.act(async () => {
      list.props.onScroll({ nativeEvent: { contentOffset: { y: ITEM_HEIGHT * 3 } } });
    });

    expect(onChange).toHaveBeenCalledWith(15);
    expect(renderer!.root.findByProps({ testID: 'depth-picker-value' }).props.children).toBe('15');
  });

  it('accepts decimal keyboard entry when valueType is float', async () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NumberWheelPicker value={0} min={0} max={40} step={0.1} unitLabel="m" valueType="float" onChange={onChange} testID="depth-picker" />,
      );
    });
    renderers.push(renderer!);

    const root = renderer!.root;

    await ReactTestRenderer.act(async () => {
      root.findByProps({ testID: 'depth-picker-input-trigger' }).props.onPress();
    });

    const input = root.findAllByProps({ testID: 'depth-picker-input' }).find(match => typeof match.props.onChangeText === 'function');
    expect(input).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      input!.props.onChangeText('15.');
      input!.props.onChangeText('15.3');
    });

    const updatedInput = root.findAllByProps({ testID: 'depth-picker-input' }).find(match => typeof match.props.onSubmitEditing === 'function');
    await ReactTestRenderer.act(async () => {
      updatedInput!.props.onSubmitEditing();
    });

    expect(onChange).toHaveBeenCalledWith(15.3);
  });
});
